export function surveyReceiptEmail(params: {
  name?: string;
  role: string;
  score: number;
  modules: string[];
  siteUrl?: string;
}) {
  const { name, role, score, modules, siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "#" } = params;
  const mods = modules.length ? modules.join(", ") : "We’ll share recommendations shortly.";
  return {
    subject: `Your GSOS Readiness Score: ${score}/100`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111">
        <h2 style="margin:0 0 12px">Thanks${name ? ", " + name : ""}!</h2>
        <p>You completed the GSOS Readiness Survey as <b>${role}</b>.</p>
        <p><b>Score:</b> ${score}/100</p>
        <p><b>Suggested Modules:</b> ${mods}</p>
        <p>We’ll follow up with a tailored blueprint. In the meantime, visit <a href="${siteUrl}">${siteUrl}</a>.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
        <p style="font-size:12px;color:#666">GSOS TATHAASTU • info@tathaastu.global</p>
      </div>
    `
  };
}
