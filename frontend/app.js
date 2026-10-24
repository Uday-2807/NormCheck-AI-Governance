
(function () {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  // --------------------------------------------------
  // SHARED HELPERS
  // --------------------------------------------------

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function toast(message) {
    let element = $("#app-toast");

    if (!element) {
      element = document.createElement("div");
      element.id = "app-toast";
      element.setAttribute("role", "status");
      element.style.cssText =
        "position:fixed;right:22px;bottom:22px;z-index:99999;" +
        "background:#242139;color:white;padding:12px 16px;" +
        "border-radius:10px;font:500 13px Arial,sans-serif;" +
        "max-width:calc(100vw - 44px);box-shadow:0 8px 24px #0002;";
      document.body.appendChild(element);
    }

    element.textContent = message;
    element.style.display = "block";

    clearTimeout(window.__normCheckToast);
    window.__normCheckToast = setTimeout(() => {
      element.style.display = "none";
    }, 3500);
  }

  async function readJSON(response) {
    const text = await response.text();

    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error("The server returned an invalid JSON response.");
    }

    if (!response.ok || data.success === false) {
      throw new Error(
        data.message ||
        data.error ||
        `Request failed with status ${response.status}`
      );
    }

    return data;
  }

  // --------------------------------------------------
  // CONTENT CHECKER
  // --------------------------------------------------

  function renderResults(result) {
    const findings = Array.isArray(result.findings)
      ? result.findings
      : [];

    const highSeverity =
      result.summary?.highSeverity ??
      findings.filter(f =>
        ["high", "critical"].includes(
          String(f.severity || "").toLowerCase()
        )
      ).length;

    const findingHTML = findings.length
      ? findings.map(finding => {
          const severity = String(finding.severity || "Medium");
          const severityLower = severity.toLowerCase();

          const severityColor =
            ["high", "critical"].includes(severityLower)
              ? "#b42318"
              : severityLower === "medium"
                ? "#b54708"
                : "#475467";

          return `
            <article style="
              border:1px solid #e7e5ee;
              border-radius:10px;
              padding:14px;
              margin-top:12px;
            ">
              <div style="
                display:flex;
                gap:10px;
                flex-wrap:wrap;
                align-items:center;
              ">
                <strong>${escapeHTML(finding.label || "Potential issue")}</strong>
                <span style="
                  color:${severityColor};
                  font-size:12px;
                  font-weight:700;
                ">${escapeHTML(severity)}</span>
              </div>

              ${finding.match ? `
                <p><strong>Matched text:</strong>
                  <code>${escapeHTML(finding.match)}</code>
                </p>` : ""}

              ${finding.evidence ? `
                <p><strong>Evidence:</strong>
                  ${escapeHTML(finding.evidence)}
                </p>` : ""}

              ${finding.explanation ? `
                <p>${escapeHTML(finding.explanation)}</p>` : ""}

              ${finding.suggestion ? `
                <p><strong>Suggestion:</strong>
                  ${escapeHTML(finding.suggestion)}
                </p>` : ""}

              <p style="font-size:12px;color:#645f7a">
                Status: ${escapeHTML(finding.status || "potential")}
              </p>
            </article>
          `;
        }).join("")
      : "<p>No findings were returned by the rule engine.</p>";

    const modal = document.createElement("div");

    modal.style.cssText = `
      position:fixed;
      inset:0;
      z-index:99998;
      background:#17132988;
      display:grid;
      place-items:center;
      padding:20px;
      font-family:Arial,sans-serif;
    `;

    modal.innerHTML = `
      <section style="
        width:min(680px,100%);
        max-height:85vh;
        overflow:auto;
        box-sizing:border-box;
        background:white;
        color:#242139;
        border-radius:16px;
        padding:24px;
        box-shadow:0 20px 60px #0003;
      ">
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:12px;
        ">
          <h2 style="margin:0">Check Results</h2>
          <button type="button" data-close>Close</button>
        </div>

        <p style="font-size:12px;color:#645f7a">
          Engine: ${escapeHTML(result.engine || "deterministic-rules")}
        </p>

        <p>
          Check ID:
          <code>${escapeHTML(result.checkId || "Unavailable")}</code>
        </p>

        <p>
          <strong>${findings.length}</strong> findings ·
          <strong>${highSeverity}</strong> high-severity findings
        </p>

        ${findingHTML}

        <button type="button" data-close style="
          background:#6D4AFF;
          color:white;
          border:0;
          padding:10px 16px;
          border-radius:8px;
          margin-top:18px;
          cursor:pointer;
        ">Done</button>
      </section>
    `;

    document.body.appendChild(modal);

    $$("[data-close]", modal).forEach(button => {
      button.addEventListener("click", () => modal.remove());
    });

    modal.addEventListener("click", event => {
      if (event.target === modal) modal.remove();
    });
  }

  function initChecker() {
    const input = $("#content-text-input");
    const runButton = $("#run-check-btn");
    const counter = $("#char-word-display");

    if (!runButton) return;

    function updateCounter() {
      if (!input || !counter) return;

      const text = input.value;
      const words = text.trim()
        ? text.trim().split(/\s+/).length
        : 0;

      counter.textContent = `${text.length} characters · ${words} words`;
    }

    input?.addEventListener("input", updateCounter);
    updateCounter();

    // Prevent an older inline handler from submitting the same check twice.
    runButton.removeAttribute("onclick");
    runButton.onclick = null;

    runButton.addEventListener("click", async event => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const content = input?.value.trim() || "";

      if (!content) {
        toast("Enter some content before running a check.");
        return;
      }

      const originalText = runButton.textContent;

      runButton.disabled = true;
      runButton.textContent = "Checking…";

      try {
        const response = await fetch("/api/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ content })
        });

        const result = await readJSON(response);

        renderResults(result);
      } catch (error) {
        console.error("NormCheck API error:", error);
        toast(`Check failed: ${error.message}`);
      } finally {
        runButton.disabled = false;
        runButton.textContent = originalText || "Run Check";
      }
    });

    $$("button").forEach(button => {
      const label = (button.textContent || "")
        .trim()
        .toLowerCase();

      if (label.includes("load sample copy")) {
        button.addEventListener("click", () => {
          if (!input) return;

          input.value =
            "Our product is the best in the world. Guaranteed results for everyone.";

          updateCounter();
        });
      }

      if (label === "clear text" || label === "clear") {
        button.addEventListener("click", () => {
          if (!input) return;

          input.value = "";
          updateCounter();
        });
      }
    });
  }

  // --------------------------------------------------
  // REVIEW QUEUE
  // --------------------------------------------------

  async function initReview() {
    const workspace = $("#review-workspace");

    // This function only runs on pages with a review workspace.
    if (!workspace) return;

    workspace.innerHTML = `
      <div class="lg:col-span-12 rounded-xl border border-[#E7E5EE] p-6">
        <p class="text-sm text-[#645F7A]">Loading saved findings...</p>
      </div>
    `;

    let findings = [];

    try {
      const response = await fetch("/api/checks?limit=20", {
        headers: { "Accept": "application/json" }
      });

      const data = await readJSON(response);

      if (!Array.isArray(data.checks)) {
        throw new Error(
          "The checks API response does not contain a checks array."
        );
      }

      findings = data.checks.flatMap(check =>
        (Array.isArray(check.findings) ? check.findings : []).map(finding => ({
          ...finding,
          checkId: check._id,
          content: check.content || ""
        }))
      );
    } catch (error) {
      console.error("Review loading error:", error);

      workspace.innerHTML = `
        <div class="lg:col-span-12 rounded-xl border border-[#E7E5EE] p-6">
          <p class="text-sm text-red-600">
            Could not load findings: ${escapeHTML(error.message)}
          </p>
          <button
            id="review-retry"
            type="button"
            class="mt-3 text-sm underline text-[#6D4AFF]">
            Retry loading findings
          </button>
        </div>
      `;

      $("#review-retry", workspace)?.addEventListener("click", initReview);
      return;
    }

    updateSummary(findings);

    if (findings.length === 0) {
      workspace.innerHTML = `
        <div class="lg:col-span-12 rounded-xl border border-[#E7E5EE] p-6">
          <p class="text-sm text-[#645F7A]">
            No findings have been saved yet. Run a content check first.
          </p>
          <a
            href="checker.html"
            class="inline-block mt-3 text-sm text-[#6D4AFF] underline">
            Open Content Checker
          </a>
        </div>
      `;
      return;
    }

    let selectedId = String(findings[0]._id);
    let saving = false;

    const statusLabels = {
      confirmed: "Confirmed",
      potential: "Potential",
      uncertain: "Uncertain",
      resolved: "Resolved"
    };

    function severityClasses(severity) {
      switch (String(severity || "Medium").toLowerCase()) {
        case "critical":
        case "high":
          return "bg-[#FCEBEC] text-[#DC4545]";
        case "medium":
          return "bg-[#FEF3C7] text-[#92400E]";
        case "low":
          return "bg-[#E8F8FA] text-[#006E75]";
        default:
          return "bg-gray-100 text-gray-700";
      }
    }

    function statusLabel(status) {
      return statusLabels[status] || "Potential";
    }

    function render() {
      const selected =
        findings.find(finding => String(finding._id) === selectedId) ||
        findings[0];

      selectedId = String(selected._id);

      workspace.innerHTML = `
        <!-- FINDINGS LIST -->
        <section class="flex flex-col gap-4 lg:col-span-6">
          <div class="flex items-center justify-between px-1">
            <h2 class="text-[13px] font-semibold text-[#242139]">
              Detected Findings (${findings.length})
            </h2>
            <button
              type="button"
              id="review-refresh"
              class="text-[12px] text-[#6D4AFF] hover:underline">
              Refresh
            </button>
          </div>

          <div class="flex flex-col gap-3">
            ${findings.map((finding, index) => {
              const isSelected = String(finding._id) === selectedId;

              return `
                <button
                  type="button"
                  data-select-finding="${escapeHTML(finding._id)}"
                  class="w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? "border-2 border-[#6D4AFF] bg-[#FAF8FF] shadow-sm"
                      : "border-[#E7E5EE] bg-white hover:border-[#6D4AFF]/50"
                  }">

                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-start gap-2 min-w-0">
                      <span class="w-5 h-5 rounded-full bg-[#F5F3FF] text-[#645F7A] flex items-center justify-center text-[11px] font-bold shrink-0">
                        ${index + 1}
                      </span>
                      <strong class="text-sm text-[#242139]">
                        ${escapeHTML(finding.label || "Potential issue")}
                      </strong>
                    </div>

                    <span class="rounded-full px-2 py-1 text-[11px] font-semibold ${severityClasses(finding.severity)}">
                      ${escapeHTML(finding.severity || "Medium")}
                    </span>
                  </div>

                  <p class="text-xs leading-5 text-[#645F7A] mt-3">
                    ${escapeHTML(finding.evidence || finding.match || "No evidence provided")}
                  </p>

                  <div class="flex flex-wrap items-center justify-between gap-2 mt-3">
                    <span class="text-xs text-[#6D4AFF]">
                      ${escapeHTML(statusLabel(finding.status))}
                    </span>
                    <span class="text-[11px] text-[#9894A8]">
                      View details →
                    </span>
                  </div>
                </button>
              `;
            }).join("")}
          </div>
        </section>

        <!-- SELECTED FINDING DETAILS -->
        <aside class="lg:col-span-6 lg:sticky lg:top-24">
          <div class="bg-white rounded-[14px] border border-[#E7E5EE] shadow-sm overflow-hidden">

            <div class="p-5 bg-[#FAF8FF] border-b border-[#E7E5EE]">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-[11px] font-mono text-[#645F7A] bg-white px-2 py-1 rounded border border-[#E7E5EE]">
                  Finding ${findings.indexOf(selected) + 1} of ${findings.length}
                </span>

                <span class="rounded-full px-2 py-1 text-[11px] font-semibold ${severityClasses(selected.severity)}">
                  ${escapeHTML(selected.severity || "Medium")}
                </span>
              </div>

              <h2 class="text-lg font-semibold text-[#242139] mt-3">
                ${escapeHTML(selected.label || "Potential issue")}
              </h2>

              <p class="text-xs text-[#645F7A] mt-2">
                Current status: ${escapeHTML(statusLabel(selected.status))}
              </p>
            </div>

            <div class="p-5 flex flex-col gap-5">

              <section>
                <h3 class="text-[11px] font-bold text-[#645F7A] uppercase tracking-wider">
                  Matched text / Evidence
                </h3>
                <div class="mt-2 p-3 rounded-lg bg-[#F5F3FF] border border-[#E7E5EE] text-sm leading-6 text-[#242139] whitespace-pre-wrap break-words">
                  ${escapeHTML(selected.evidence || selected.match || "No evidence provided.")}
                </div>

                ${selected.match ? `
                  <p class="mt-2 text-xs text-[#645F7A]">
                    Matched phrase: <span class="font-mono">${escapeHTML(selected.match)}</span>
                  </p>
                ` : ""}
              </section>

              <section>
                <h3 class="text-[11px] font-bold text-[#645F7A] uppercase tracking-wider">
                  Why it was flagged
                </h3>
                <p class="mt-2 p-3 rounded-lg bg-[#F8F7FC] border border-[#E7E5EE] text-sm leading-6 text-[#484556] whitespace-pre-wrap break-words">
                  ${escapeHTML(selected.explanation || "No explanation provided by the rule engine.")}
                </p>
              </section>

              <section>
                <h3 class="text-[11px] font-bold text-[#18865B] uppercase tracking-wider">
                  Suggested correction
                </h3>

                <textarea
                  id="review-suggestion"
                  rows="4"
                  readonly
                  class="w-full mt-2 rounded-lg border border-[#E7E5EE] p-3 text-sm leading-6 text-[#242139] bg-[#F0FDF4] resize-y"
                >${escapeHTML(selected.suggestion || "")}</textarea>

                <div class="flex justify-end mt-2">
                  <button
                    type="button"
                    id="copy-suggestion"
                    class="inline-flex items-center gap-1 rounded-lg border border-[#18865B]/30 px-3 py-2 text-xs font-medium text-[#18865B] hover:bg-[#F0FDF4]">
                    <span class="material-symbols-outlined text-sm">content_copy</span>
                    Copy Correction
                  </button>
                </div>

                <p class="text-[11px] text-[#9894A8] mt-1">
                  Advisory only — corrections are not automatically applied.
                </p>
              </section>

              <section class="pt-4 border-t border-[#E7E5EE]">
                <h3 class="text-[11px] font-bold text-[#645F7A] uppercase tracking-wider mb-3">
                  Review Decision
                </h3>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    data-status="confirmed"
                    class="rounded-lg border p-3 text-xs font-medium transition-colors ${
                      selected.status === "confirmed"
                        ? "border-[#6D4AFF] bg-[#F5F3FF] text-[#6D4AFF]"
                        : "border-[#E7E5EE] text-[#242139] hover:border-[#6D4AFF]"
                    }">
                    <span class="material-symbols-outlined text-base block mb-1">check_circle</span>
                    Confirm Issue
                  </button>

                  <button
                    type="button"
                    data-status="potential"
                    class="rounded-lg border p-3 text-xs font-medium transition-colors ${
                      selected.status === "potential"
                        ? "border-[#6D4AFF] bg-[#F5F3FF] text-[#6D4AFF]"
                        : "border-[#E7E5EE] text-[#242139] hover:border-[#6D4AFF]"
                    }">
                    <span class="material-symbols-outlined text-base block mb-1">help</span>
                    Mark Potential
                  </button>

                  <button
                    type="button"
                    data-status="uncertain"
                    class="rounded-lg border p-3 text-xs font-medium transition-colors ${
                      selected.status === "uncertain"
                        ? "border-[#6D4AFF] bg-[#F5F3FF] text-[#6D4AFF]"
                        : "border-[#E7E5EE] text-[#242139] hover:border-[#6D4AFF]"
                    }">
                    <span class="material-symbols-outlined text-base block mb-1">question_mark</span>
                    Mark Uncertain
                  </button>
                </div>

                <button
                  type="button"
                  data-status="resolved"
                  class="w-full mt-3 rounded-lg bg-[#6D4AFF] hover:bg-[#5835E5] text-white p-3 text-sm font-medium transition-colors">
                  <span class="material-symbols-outlined text-base align-middle mr-1">task_alt</span>
                  Mark Resolved
                </button>

                <p
                  id="review-message"
                  role="status"
                  aria-live="polite"
                  class="text-xs text-[#645F7A] mt-3">
                </p>
              </section>
            </div>
          </div>
        </aside>
      `;

      // Select a finding from the list.
      $$("[data-select-finding]", workspace).forEach(button => {
        button.addEventListener("click", () => {
          selectedId = button.dataset.selectFinding;
          render();
        });
      });

      // Save a review decision to the backend.
      $$("[data-status]", workspace).forEach(button => {
        button.addEventListener("click", () => {
          updateStatus(button.dataset.status, button);
        });
      });

      // Copy the suggested correction.
      $("#copy-suggestion", workspace)?.addEventListener("click", async event => {
        const button = event.currentTarget;
        const suggestion = $("#review-suggestion", workspace)?.value || "";

        if (!suggestion.trim()) {
          toast("There is no suggested correction to copy.");
          return;
        }

        try {
          await navigator.clipboard.writeText(suggestion);
          button.innerHTML =
            '<span class="material-symbols-outlined text-sm">check</span> Copied';
        } catch (error) {
          console.error("Clipboard error:", error);
          toast("Could not copy automatically. Select and copy the text manually.");
          return;
        }

        setTimeout(() => {
          if (button.isConnected) {
            button.innerHTML =
              '<span class="material-symbols-outlined text-sm">content_copy</span> Copy Correction';
          }
        }, 1800);
      });

      // Reload saved findings from the API.
      $("#review-refresh", workspace)?.addEventListener("click", () => {
        initReview();
      });
    }

    async function updateStatus(status, button) {
      if (saving) return;

      const selected = findings.find(
        finding => String(finding._id) === selectedId
      );

      if (!selected?._id) {
        toast("This finding has no database ID.");
        return;
      }

      saving = true;

      const originalButtonText = button.innerHTML;
      button.disabled = true;

      const message = $("#review-message", workspace);
      if (message) message.textContent = "Saving review decision...";

      try {
        const response = await fetch(
          `/api/findings/${encodeURIComponent(selected._id)}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({ status })
          }
        );

        const result = await readJSON(response);

        selected.status = result.finding?.status || status;

        updateSummary(findings);
        render();

        const updatedMessage = $("#review-message", workspace);
        if (updatedMessage) {
          updatedMessage.textContent =
            `Saved successfully: ${statusLabel(selected.status)}.`;
        }

        toast(`Finding status saved: ${statusLabel(selected.status)}.`);
      } catch (error) {
        console.error("Finding status update failed:", error);

        const currentMessage = $("#review-message", workspace);
        if (currentMessage) {
          currentMessage.textContent = `Could not save: ${error.message}`;
        }

        button.disabled = false;
        button.innerHTML = originalButtonText;
      } finally {
        saving = false;
      }
    }

    render();
  }

  // --------------------------------------------------
  // REVIEW SUMMARY
  // --------------------------------------------------

  function updateSummary(findings) {
    const totalElement = $("#summary-total");
    const highElement = $("#summary-high");
    const pendingElement = $("#summary-pending");
    const sidebarCount = $("#sidebar-finding-count");

    const total = findings.length;

    const high = findings.filter(finding =>
      ["high", "critical"].includes(
        String(finding.severity || "").toLowerCase()
      )
    ).length;

    const pending = findings.filter(finding =>
      String(finding.status || "potential").toLowerCase() !== "resolved"
    ).length;

    if (totalElement) {
      totalElement.textContent =
        `${total} ${total === 1 ? "finding" : "findings"}`;
    }

    if (highElement) {
      highElement.textContent = `${high} high severity`;
    }

    if (pendingElement) {
      pendingElement.textContent = `${pending} awaiting review`;
    }

    if (sidebarCount) {
      sidebarCount.textContent = String(total);
    }
  }

  // --------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------

  function initApp() {
    initChecker();
    initReview();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp, { once: true });
  } else {
    initApp();
  }
})();
