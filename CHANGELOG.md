# Changelog

<h4>1.1.1 — 2026-04-21</h4>
<ul>
    <li>Corrected <code>README.md<code>, MODAL x ÉCHAP is no longer de default in French.</li>
</ul>

<h4>1.1.0 — 2026-04-20</h4>
<ul>
    <li>Internationalization: text domain <code>a11y_ux_checker</code>, source strings in Canadian English (<code>en_CA</code>), Canadian French language pack (<code>languages/a11y_ux_checker-fr_CA.mo</code>).</li>
    <li>Browser-side audit strings delivered via <code>wp_localize_script</code> and the global <code>a11yUxChecker</code> object; helper script <code>assets/js/i18n-runtime.js</code> (<code>a11yUxSprintf</code>).</li>
    <li>Audit access limited to administrators (<code>manage_options</code>) for the admin bar link and script loading; filter <code>a11y_ux_checker_user_can_run_audit</code> to customize who may run audits.</li>
    <li>Removed all GitHub token support from the plugin (<code>ADN_A11Y_CHECKER_GITHUB_TOKEN</code>).</li>
</ul>



<h4>1.0.0 — 2026-04-19</h4>
<ul>
    <li>Initial release.</li>
</ul>
