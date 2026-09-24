import { stats } from "@/data/stats";
import Counter from "./Counter";
import Reveal from "./Reveal";

export default function StatsSection() {
  return (
    <section className="border-y border-border bg-bg-elevated py-16">
      <div className="pk-container">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-6">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 90}>
              <div className="text-center md:text-left">
                <p className="pk-display text-3xl font-extrabold text-text sm:text-4xl">
                  <Counter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </p>
                <p className="mt-2 text-sm text-text-muted">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
