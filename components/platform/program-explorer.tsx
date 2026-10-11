"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { audience, example, faqs, leaveWith, lessonCount, modules, outcomes, requirements } from "@/lib/course-data";
import { heroHeadline, roadmapWeeks } from "@/lib/node-landing-data";
import { useFlagship } from "@/components/providers/pricing-provider";
import { actModel, experts, tracks } from "@/lib/platform-data";

import { ProgramMetro } from "./program-metro";
import c from "./course.module.css";

const TABS = [
  { id: "overview", label: "Overview", icon: "dashboard" },
  { id: "curriculum", label: "Curriculum", icon: "menu_book" },
  { id: "month", label: "The month", icon: "calendar_month" },
  { id: "for-you", label: "Who it’s for", icon: "group" },
  { id: "experts", label: "Experts", icon: "school" },
  { id: "faq", label: "FAQ", icon: "help" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const ACT_Q = Object.fromEntries(actModel.map((a) => [a.name, a.q]));
const WEEK_COLORS = ["#e91e63", "#008080", "#6d48d8", "#c49000"];
const trackName = (id: string) => tracks.find((t) => t.id === id)?.name ?? "";

/* The program explorer: a tab bar that switches panels (no long scroll), with a two-pane curriculum browser */
export function ProgramExplorer() {
  const plan = useFlagship();
  const [tab, setTab] = useState<TabId>("overview");
  const [mod, setMod] = useState(1);
  const anchorRef = useRef<HTMLDivElement>(null); // where the tab bar sits before it sticks

  /* bring the top of the panel into view (only upwards when `onlyIfPast`) */
  const toPanel = (onlyIfPast = false) => {
    const a = anchorRef.current;
    if (!a) return;
    const top = a.getBoundingClientRect().top + window.scrollY - 82;
    if (!onlyIfPast || window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
  };

  /* deep links: #curriculum, #faq … */
  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      if (!TABS.some((t) => t.id === id)) return false;
      setTab(id as TabId);
      return true;
    };
    const onHash = () => { if (fromHash()) toPanel(); };
    const first = window.setTimeout(fromHash, 0);
    window.addEventListener("hashchange", onHash);
    return () => { window.clearTimeout(first); window.removeEventListener("hashchange", onHash); };
  }, []);

  const open = (id: TabId, moduleN?: number) => {
    setTab(id);
    if (moduleN !== undefined) setMod(moduleN);
    window.history.replaceState(null, "", `#${id}`);
    toPanel(true);
  };

  const m = modules.find((x) => x.n === mod) ?? modules[1];

  return (
    <>
      {/* tab bar */}
      <div ref={anchorRef} aria-hidden="true" />
      <div className={c.bar}>
        <div className={`${c.wrap} ${c.barIn}`}>
          <div className={c.tabs} role="tablist" aria-label="Program">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`${c.tab} ${tab === t.id ? c.tabOn : ""}`} onClick={() => open(t.id)}>
                <MaterialSymbol name={t.icon} className={c.ms} />{t.label}
              </button>
            ))}
          </div>
          <div className={c.barBuy}>
            <span>{plan.was ? <s style={{ fontSize: "0.5em", opacity: 0.5, marginRight: 6 }}>{plan.was}</s> : null}{plan.price}<small>one-time{plan.off ? ` · ${plan.off}` : ""}</small></span>
            <Link href="/register" className={`${c.btn} ${c.btnPink} ${c.btnSm}`}>Enroll</Link>
          </div>
        </div>
      </div>

      <div className={`${c.wrap} ${c.panel}`} role="tabpanel" key={tab}>
        {/* ---------- overview ---------- */}
        {tab === "overview" && (
          <div className={c.stack}>
            <div className={c.ovTop}>
              <section className={c.learn}>
                <span className={c.kicker}>What you’ll learn</span>
                <h2 className={c.h2}>From an idea to software people use.</h2>
                <ul>{outcomes.map((o) => <li key={o}><MaterialSymbol name="check_circle" className={c.ms} />{o}</li>)}</ul>
              </section>
              <section className={c.glance}>
                <span className={c.kicker}>At a glance</span>
                <dl>
                  <div><dt>30</dt><dd>days</dd></div>
                  <div><dt>{modules.length}</dt><dd>modules</dd></div>
                  <div><dt>{lessonCount}</dt><dd>lessons</dd></div>
                  <div><dt>8</dt><dd>acts of the lifecycle</dd></div>
                  <div><dt>1</dt><dd>real project of yours</dd></div>
                  <div><dt>0</dt><dd>experience needed</dd></div>
                </dl>
              </section>
            </div>

            <section>
              <span className={c.kicker}>How it’s different</span>
              <div className={c.features}>
                {heroHeadline.lines.map((l) => (
                  <div key={l.title}><MaterialSymbol name={l.icon} className={c.featIcon} /><b>{l.title}</b><span>{l.body}</span></div>
                ))}
              </div>
            </section>

            <section>
              <div className={c.secHead}>
                <div><span className={c.kicker}>Your month</span><h2 className={c.h2}>Four weeks, one project.</h2></div>
                <button type="button" className={c.more} onClick={() => open("month")}>See the month<MaterialSymbol name="arrow_forward" className={c.ms} /></button>
              </div>
              <div className={c.weekStrip}>
                {roadmapWeeks.map((w, i) => (
                  <button key={w.week} type="button" className={c.weekCard} style={{ ["--c" as string]: WEEK_COLORS[i] }} onClick={() => open("month")}>
                    <small>{w.week}</small>
                    <b>{w.title}</b>
                    <span>{w.acts.map((a) => a.name).join(" · ")}</span>
                  </button>
                ))}
              </div>
            </section>

            <div className={c.ovBottom}>
              <section className={c.exampleCard}>
                <MaterialSymbol name="lightbulb" className={c.exIcon} />
                <span className={c.kicker}>The example you’ll follow</span>
                <p>{example}</p>
                <button type="button" className={c.more} onClick={() => open("curriculum", 1)}>Follow it through the modules<MaterialSymbol name="arrow_forward" className={c.ms} /></button>
              </section>
              <section>
                <span className={c.kicker}>You leave with</span>
                <div className={c.leave}>
                  {leaveWith.map((x) => <div key={x.title}><MaterialSymbol name={x.icon} className={c.leaveIcon} /><b>{x.title}</b><span>{x.body}</span></div>)}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ---------- curriculum: module list + module detail ---------- */}
        {tab === "curriculum" && (
          <div className={c.cur}>
            <nav className={c.modList} aria-label="Modules">
              <span className={c.kicker}>{modules.length} modules · {lessonCount} lessons</span>
              {modules.map((x) => (
                <button key={x.id} type="button" className={`${c.modItem} ${x.n === mod ? c.modOn : ""}`} style={{ ["--c" as string]: x.color }} onClick={() => setMod(x.n)}>
                  <span className={c.modN}>{String(x.n).padStart(2, "0")}</span>
                  <span className={c.modName}><b>{x.title}</b><small>{x.days}</small></span>
                  {x.preview ? <span className={c.free}>Free</span> : null}
                </button>
              ))}
            </nav>

            <article className={c.modDetail} style={{ ["--c" as string]: m.color }} key={m.id}>
              <div className={c.modHead}>
                <span className={c.modBig}>{String(m.n).padStart(2, "0")}</span>
                <div>
                  <span className={c.modMeta}>Module {m.n} · {m.days}{m.n > 0 && m.n < 9 ? ` · ${trackName(m.track)} track` : ""}{m.preview ? " · Free preview" : ""}</span>
                  <h2 className={c.modTitle}>{m.title}</h2>
                </div>
              </div>
              <p className={c.modQ}>“{m.question}”</p>
              <p className={c.modStory}>{m.story}</p>

              <h3 className={c.h3}>Lessons</h3>
              <ol className={c.lessonGrid}>
                {m.lessons.map((l, i) => (
                  <li key={l.title}><span>{m.n}.{i + 1}</span><b>{l.title}</b><em>{l.line}</em></li>
                ))}
              </ol>

              <h3 className={c.h3}>What you’ll make</h3>
              <ul className={c.makes}>{m.makes.map((x) => <li key={x}><MaterialSymbol name="description" className={c.ms} />{x}</li>)}</ul>

              <div className={c.modNav}>
                {m.n > 0 ? <button type="button" onClick={() => setMod(m.n - 1)}><MaterialSymbol name="arrow_back" className={c.ms} />Module {m.n - 1}</button> : <span />}
                {m.n < modules.length - 1 ? <button type="button" onClick={() => setMod(m.n + 1)}>Module {m.n + 1}<MaterialSymbol name="arrow_forward" className={c.ms} /></button> : <Link href="/register">Enroll · {plan.price}<MaterialSymbol name="arrow_forward" className={c.ms} /></Link>}
              </div>
            </article>
          </div>
        )}

        {/* ---------- the month ---------- */}
        {tab === "month" && (
          <div className={c.stack}>
            <section>
              <span className={c.kicker}>The month as a route map</span>
              <h2 className={c.h2}>Three tracks. Thirty days.</h2>
              <p className={c.p}>Discovery, then delivery, then run and learn — every act on your own project. Drag the day, or ride the line.</p>
              <ProgramMetro />
            </section>
            <section className={c.weeks}>
              {roadmapWeeks.map((w, i) => (
                <div key={w.week} className={c.week} style={{ ["--c" as string]: WEEK_COLORS[i] }}>
                  <small>{w.week}</small>
                  <b>{w.title}</b>
                  <ul>
                    {w.acts.map((a) => {
                      const target = modules.find((x) => x.id === a.name.toLowerCase().replace("-", ""));
                      return (
                        <li key={a.name}>
                          <button type="button" onClick={() => target && open("curriculum", target.n)}>
                            <span className={c.weekAct}>{a.name}<em>{a.days}</em></span>
                            {ACT_Q[a.name] ? <span className={c.weekQ}>{ACT_Q[a.name]}</span> : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </section>
          </div>
        )}

        {/* ---------- who it's for ---------- */}
        {tab === "for-you" && (
          <div className={c.stack}>
            <section>
              <span className={c.kicker}>Who it’s for</span>
              <h2 className={c.h2}>Wherever you’re starting from.</h2>
              <div className={c.aud}>
                {audience.map((a) => (
                  <div key={a.who} style={{ ["--c" as string]: a.color }}>
                    <MaterialSymbol name={a.icon} className={c.audIcon} />
                    <b>{a.who}</b>
                    <p>{a.what}</p>
                  </div>
                ))}
              </div>
            </section>
            <section className={c.needs}>
              <div>
                <span className={c.kicker}>What you need</span>
                <h2 className={c.h2}>Less than you think.</h2>
              </div>
              <ul>{requirements.map((r) => <li key={r}><MaterialSymbol name="check" className={c.ms} />{r}</li>)}</ul>
            </section>
          </div>
        )}

        {/* ---------- experts ---------- */}
        {tab === "experts" && (
          <section>
            <span className={c.kicker}>Experts</span>
            <h2 className={c.h2}>Learn from experts who ship.</h2>
            <p className={c.p}>Your agents do the heavy lifting. Experts make sure you learn the judgement — the part the market pays for.</p>
            <div className={c.experts}>
              {experts.map((x) => (
                <div key={x.title} className={c.expert} style={{ ["--c" as string]: x.color }}>
                  <span className={c.expertIcon}><MaterialSymbol name={x.icon} /></span>
                  <b>{x.title}</b>
                  <p>{x.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------- faq ---------- */}
        {tab === "faq" && (
          <section className={c.faqWrap}>
            <div>
              <span className={c.kicker}>FAQ</span>
              <h2 className={c.h2}>Questions, answered.</h2>
              <p className={c.p}>Still unsure? Start with Module 1 — it’s a free preview.</p>
              <button type="button" className={c.more} onClick={() => open("curriculum", 1)}>Open Module 1<MaterialSymbol name="arrow_forward" className={c.ms} /></button>
            </div>
            <div className={c.faq}>
              {faqs.map((f, i) => (
                <details key={f.q} open={i === 0}>
                  <summary>{f.q}<MaterialSymbol name="add" className={c.ms} /></summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
