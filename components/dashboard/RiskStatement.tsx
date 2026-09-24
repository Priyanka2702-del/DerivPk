export default function RiskStatement() {
  return (
    <div className="mt-6 rounded-xl border border-border bg-surface p-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
        Risk Statement
      </p>
      <p className="text-xs leading-relaxed text-text-muted">
        All investments entail risks and may result in both profits and losses. In particular,
        trading leveraged derivative products such as Foreign Exchange (Forex) and Contracts for
        Difference (CFDs) carries a high level of risk to your capital. All these derivative
        products, many of which are leveraged, may not be appropriate for all investors. The
        effect of leverage is that both gains and losses are magnified. The prices of leveraged
        derivative products may change to your detriment very quickly, and it is possible for you
        to lose more than your invested capital. You may be required to make further payments. It
        is important that you understand that with these investments, your capital is at risk.
        Past performance is not a guide to future performance. It is your responsibility to
        ensure that you make an informed decision about whether or not to invest with us. Before
        deciding to invest in any financial product, you should carefully consider your
        investment objectives, trading knowledge and experience and affordability. You should
        seek independent professional financial advice if you do not understand the risks
        involved. You should only trade in Forex and CFDs if you have sufficient knowledge and
        experience. See our{" "}
        <a href="/risk-disclosure" className="font-medium text-accent-2 underline underline-offset-2">
          Risk Disclosure
        </a>{" "}
        for full details.
      </p>
    </div>
  );
}