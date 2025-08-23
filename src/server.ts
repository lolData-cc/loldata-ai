// src/server.ts
import "dotenv/config";
import Fastify from "fastify";
import { z } from "zod";

import { getPlayerRow, getCohortStats, getCohortTopItems } from "./db-cohort";
import { buildComparison } from "./compare";
import { buildPrompt } from "./prompt";
import { askLLM, askText } from "./llm";
import { buildPlayerRowFromRiot } from "./riot-to-row";
import { UiPayloadZ } from "./analysis-schema";
import { scoreFromDeltas } from "./scoring";
import { fetchMatch } from "./riot";
import { ensureAnalysisOrRepair } from "./guard";

import { extractIntent } from "./chat-intent";
import {
  mostCommonRoleForChampion,
  mostCommonPatchMajorForChampion,
  loadCohort,
} from "./chat-data";
import { buildChatPrompt } from "./chat-prompt";
import { enemyTagsFromNames } from "./enemy-tags";
import { getChampionRelease } from "./static-data";
import { fallbackAnswer } from "./chat-fallback";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ ok: true }));

// ---------- Match Analyze ----------
const AnalyzeSchema = z.object({
  matchId: z.string().min(6),
  puuid: z.string().min(10),
  sameMajor: z.boolean().optional().default(true),
});

app.post("/matchanalyze", async (req, reply) => {
  const parse = AnalyzeSchema.safeParse(req.body);
  if (!parse.success) return reply.code(400).send({ error: parse.error.issues });
  const { matchId, puuid, sameMajor } = parse.data;

  try {
    // 1) try DB row; else fallback Riot
    let me = await getPlayerRow(matchId, puuid);
    const source: "db" | "riot" = me ? "db" : "riot";
    if (!me) me = await buildPlayerRowFromRiot(matchId, puuid);

    // 2) enemy comp via Riot for targeted advice
    const matchDto = await fetchMatch(matchId);
    const info = matchDto.info ?? {};
    const enemy_comp: string[] = (info.participants ?? [])
      .filter((p: any) => p.teamId !== me!.team_id)
      .map((p: any) => String(p.championName || "Unknown"));

    // 3) cohort + top items
    const cohort = await getCohortStats(me, sameMajor);
    if (!cohort || !cohort.n)
      return reply
        .code(404)
        .send({ error: "Empty cohort for champion/role/patch/queue" });
    const topItems = await getCohortTopItems(me, 6, sameMajor);

    // 4) comparison pack + rating
    const pack = buildComparison(me, cohort, topItems);
    const rating = scoreFromDeltas(pack.deltas);

    // 5) LLM (grounded JSON) + guard
    const prompt = buildPrompt({
      player: { champ: pack.my.champ, role: pack.my.role, win: pack.my.win },
      deltas: pack.deltas,
      cohort: pack.cohort,
      top_items: pack.cohort.topItems,
      enemy_comp,
    });
    const llmRaw = await askLLM(prompt);
    const analysis = await ensureAnalysisOrRepair(llmRaw, {
      player: { champ: pack.my.champ, role: pack.my.role, win: pack.my.win },
      deltas: pack.deltas,
      cohort: pack.cohort,
      top_items: pack.cohort.topItems,
      enemy_comp,
    });

    // 6) final payload
    const uiPayload = {
      meta: {
        source,
        patch: me.patch,
        queueId: me.queue_id,
        champion: me.champion_name,
        role: me.role_norm,
        win: me.win,
        enemy_comp,
      },
      cohort: {
        n: pack.cohort.n,
        winrate: pack.cohort.winrate,
        topItems: pack.cohort.topItems,
      },
      deltas: pack.deltas,
      rating,
      analysis,
    };

    const finalPayload = UiPayloadZ.parse(uiPayload);
    return reply.send(finalPayload);
  } catch (e: any) {
    req.log.error(e);
    const msg = String(e?.message || "");
    if (msg.includes("PUUID non presente"))
      return reply.code(404).send({ error: "PUUID not found in Riot match" });
    if (msg.startsWith("Riot API"))
      return reply
        .code(502)
        .send({ error: "Riot API error", detail: msg });
    return reply.code(500).send({ error: "Internal error", detail: msg });
  }
});

// ---------- Chat Ask ----------
app.post("/chat/ask", async (req, reply) => {
  const schema = z.object({ prompt: z.string().min(2) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: parsed.error.issues });
  const { prompt } = parsed.data;

  try {
    const intent = await extractIntent(prompt);

    // Ensure role is always filled when champion is present
    let role = intent.role;
    if (!role && intent.champion) {
      role = await mostCommonRoleForChampion(intent.champion);
      if (!role) role = "TOP"; // safe default if DB empty
    }

    // A) Static: release date
    if (intent.topic === "release_date" && intent.champion) {
      const row = await getChampionRelease(intent.champion);
      if (row?.release_date) {
        return reply.send({
          mode: "static",
          intent: { ...intent, role },
          answer: `${row.name} released on ${row.release_date}.`,
          extra: { class: row.class, tags: row.tags },
        });
      }
      const answer = await askText(
        `Answer in English.\nQ: ${prompt}`,
        { retries: 1 }
      );
      return reply.send({
        mode: "generic",
        intent: { ...intent, role },
        answer,
      });
    }

    // B) Champion-centric queries
    if (intent.champion) {
      const queueId = intent.queue_id ?? 420;
      const patchMajor =
        intent.patch_major ??
        (await mostCommonPatchMajorForChampion(
          intent.champion,
          role,
          queueId
        )) ??
        "15";

      const { cohort, topItems } = await loadCohort(
        intent.champion,
        role as any,
        queueId,
        patchMajor,
        true
      );

      if (cohort?.n) {
        const pack = {
          question: prompt,
          topic: intent.topic,
          champion: intent.champion,
          role,
          queueId,
          patch_major: patchMajor,
          cohort: {
            n: cohort.n,
            winrate: +(cohort.winrate * 100).toFixed(1),
          },
          top_items: topItems?.map((t) => ({
            item: t.item_id,
            freq: +(+t.freq * 100).toFixed(1),
          })),
        };

        const answer = await askText(buildChatPrompt(pack), { retries: 1 });
        return reply.send({
          mode: "cohort",
          intent: { ...intent, role },
          cohort: pack.cohort,
          answer,
        });
      }
    }

    // C) Fallback: generic GPT
    let answer = await askText(
      `You are a League of Legends coach. Answer in English.\nQ: ${prompt}`,
      { retries: 1 }
    );
    if (!answer)
      answer = fallbackAnswer({ question: prompt, topic: "general" });

    return reply.send({ mode: "generic", intent: { ...intent, role }, answer });
  } catch (e: any) {
    req.log.error(e);
    return reply
      .code(500)
      .send({ error: "Internal error", detail: e?.message });
  }
});

const port = Number(process.env.PORT ?? 3000);
app
  .listen({ port, host: "0.0.0.0" })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
