// ─── Web3Forms Configuration ──────────────────────────────────────────────────
const WEB3FORMS_ACCESS_KEY = "533ce89d-3e49-4a23-a6c0-0dd6d6ef24a5";
// ─────────────────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  { name: "HP Indigo Department", recipients: ["said.selectkalaos@gmail.com"] },
  { name: "Large Format Department", recipients: ["said.selectkalaos@gmail.com"] },
  { name: "Design Work", recipients: ["said.selectkalaos@gmail.com"] },
  { name: "Offset Printing Department", recipients: ["said.selectkalaos@gmail.com"] }
];

const form = document.getElementById("job-card-form");
const departmentList = document.getElementById("department-list");
const departmentTemplate = document.getElementById("department-template");
const summaryList = document.getElementById("summary-list");
const formStatus = document.getElementById("form-status");
const summaryJobTitle = document.getElementById("summary-job-title");
const summaryClient = document.getElementById("summary-client");
const summaryDate = document.getElementById("summary-date");
const summaryPrice = document.getElementById("summary-price");
const summaryPayment = document.getElementById("summary-payment");
const successScreen = document.getElementById("success-screen");
const successMessage = document.getElementById("success-message");
const successResetButton = document.getElementById("success-reset");
const totalPriceAmountInput = form.querySelector('input[name="totalPriceAmount"]');
const totalPriceCurrencyInput = form.querySelector('select[name="totalPriceCurrency"]');
const uppercaseFields = form.querySelectorAll('input[type="text"], textarea');
const layout = document.querySelector(".layout");
const hero = document.querySelector(".hero");

const departmentNodes = DEPARTMENTS.map((departmentConfig, index) => {
  const fragment = departmentTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".department-card");
  const checkbox = fragment.querySelector(".department-checkbox");
  const title = fragment.querySelector(".department-card__title");
  title.textContent = departmentConfig.name;
  checkbox.name = `department-${index}`;
  checkbox.addEventListener("change", () => {
    card.classList.toggle("is-active", checkbox.checked);
    updateSummary();
  });
  fragment.querySelectorAll("input, textarea").forEach((field) => {
    field.addEventListener("input", updateSummary);
  });
  departmentList.appendChild(fragment);
  const appendedCard = departmentList.lastElementChild;
  return {
    name: departmentConfig.name,
    recipients: departmentConfig.recipients,
    card: appendedCard,
    checkbox: appendedCard.querySelector(".department-checkbox"),
    quantity: appendedCard.querySelector(".department-quantity"),
    size: appendedCard.querySelector(".department-size"),
    material: appendedCard.querySelector(".department-material"),
    finishing: appendedCard.querySelector(".department-finishing"),
    notes: appendedCard.querySelector(".department-notes")
  };
});

function getDepartmentPayload() {
  return departmentNodes.map((node) => ({
    name: node.name,
    selected: node.checkbox.checked,
    quantity: node.quantity.value.trim(),
    size: node.size.value.trim(),
    material: node.material.value.trim(),
    finishing: node.finishing.value.trim(),
    notes: node.notes.value.trim()
  }));
}

function getFormPayload() {
  const formData = new FormData(form);
  const totalPriceAmount = (formData.get("totalPriceAmount") || "").toString().trim();
  const totalPriceCurrency = (formData.get("totalPriceCurrency") || "RWF").toString();
  return {
    jobTitle: (formData.get("jobTitle") || "").toString().trim(),
    clientName: (formData.get("clientName") || "").toString().trim(),
    commercialPerson: (formData.get("commercialPerson") || "").toString().trim(),
    clientContact: (formData.get("clientContact") || "").toString().trim(),
    dueDate: (formData.get("dueDate") || "").toString().trim(),
    priority: (formData.get("priority") || "").toString(),
    totalPriceAmount,
    totalPriceCurrency,
    totalPrice: totalPriceAmount ? `${totalPriceAmount} ${totalPriceCurrency}` : "",
    paymentStatus: (formData.get("paymentStatus") || "").toString(),
    departments: getDepartmentPayload()
  };
}

function formatNumberWithCommas(value) {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

function getRecipientsForPayload(payload) {
  return Array.from(
    new Set(
      payload.departments
        .filter((d) => d.selected)
        .flatMap((d) => {
          const node = departmentNodes.find((item) => item.name === d.name);
          return node ? node.recipients : [];
        })
    )
  );
}

function buildEmailText(payload) {
  const activeDepartments = payload.departments.filter((d) => d.selected);
  const departmentText = activeDepartments
    .map((d) => {
      return [
        d.name,
        d.quantity ? `  Quantity: ${d.quantity}` : "",
        d.size ? `  Size / format: ${d.size}` : "",
        d.material ? `  Material: ${d.material}` : "",
        d.finishing ? `  Finishing: ${d.finishing}` : "",
        d.notes ? `  Notes: ${d.notes}` : ""
      ].filter(Boolean).join("\n");
    })
    .join("\n\n");

  return [
    `Client / company: ${payload.clientName || "-"}`,
    `Job Description: ${payload.jobTitle || "-"}`,
    `Commercial Agent: ${payload.commercialPerson || "-"}`,
    `Client contact: ${payload.clientContact || "-"}`,
    `Due date: ${payload.dueDate || "-"}`,
    `Priority: ${payload.priority || "-"}`,
    `Total price: ${payload.totalPrice || "-"}`,
    `Payment status: ${payload.paymentStatus || "-"}`,
    "",
    "Departments:",
    departmentText || "No department was selected."
  ].join("\n");
}

function updateSummary() {
  const payload = getFormPayload();
  summaryJobTitle.textContent = payload.clientName || "No client yet";
  summaryClient.textContent = payload.jobTitle || "No description yet";
  summaryDate.textContent = payload.dueDate || "Not set";
  summaryPrice.textContent = payload.totalPrice || "Not set";
  summaryPayment.textContent = payload.paymentStatus || "Fully Paid";

  const activeDepartments = payload.departments.filter((d) => d.selected);
  summaryList.innerHTML = "";

  if (activeDepartments.length === 0) {
    summaryList.innerHTML = `
      <div class="summary-empty">
        <strong>No departments selected yet.</strong>
        <p>Choose one or more departments to build the production summary.</p>
      </div>
    `;
    return;
  }

  activeDepartments.forEach((d) => {
    const item = document.createElement("article");
    item.className = "summary-item";
    const details = [
      d.quantity ? `Quantity: ${d.quantity}` : "",
      d.size ? `Size / format: ${d.size}` : "",
      d.material ? `Material: ${d.material}` : "",
      d.finishing ? `Finishing: ${d.finishing}` : "",
      d.notes ? `Notes: ${d.notes}` : ""
    ].filter(Boolean).map((line) => `<p>${line}</p>`).join("");
    item.innerHTML = `<h3>${d.name}</h3>${details || "<p>No production notes added yet.</p>"}`;
    summaryList.appendChild(item);
  });
}

function setStatus(message, state) {
  formStatus.textContent = message;
  formStatus.className = "form-status";
  if (state) formStatus.classList.add(`is-${state}`);
}

function showSuccessScreen() {
  successMessage.textContent = "Please follow up with the operator in charge!";
  successScreen.hidden = false;
  layout.hidden = true;
  hero.hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function hideSuccessScreen() {
  successScreen.hidden = true;
  layout.hidden = false;
  hero.hidden = false;
}

function resetFormAfterSend() {
  form.reset();
  departmentNodes.forEach((node) => node.card.classList.remove("is-active"));
  updateSummary();
}

form.addEventListener("input", updateSummary);

totalPriceAmountInput.addEventListener("input", () => {
  totalPriceAmountInput.value = formatNumberWithCommas(totalPriceAmountInput.value);
  updateSummary();
});

totalPriceCurrencyInput.addEventListener("change", updateSummary);

uppercaseFields.forEach((field) => {
  field.addEventListener("input", () => {
    const start = field.selectionStart;
    const end = field.selectionEnd;
    field.value = field.value.toUpperCase();
    if (typeof start === "number" && typeof end === "number") {
      field.setSelectionRange(start, end);
    }
  });
});

successResetButton.addEventListener("click", () => {
  window.location.assign(window.location.href.split("?")[0] + `?fresh=${Date.now()}`);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = getFormPayload();
  const activeDepartments = payload.departments.filter((d) => d.selected);

  if (!payload.jobTitle || !payload.clientName || !payload.commercialPerson) {
    setStatus("Please complete Client / company, Job Description, and Commercial Agent.", "error");
    return;
  }

  if (activeDepartments.length === 0) {
    setStatus("Please select at least one department before sending the job card.", "error");
    return;
  }

  const submitButton = form.querySelector(".submit-button");
  submitButton.disabled = true;
  setStatus("Sending job card...", "");

  const subject = `Job Card: ${payload.jobTitle} / ${payload.clientName}`;
  const body = buildEmailText(payload);
  const recipients = getRecipientsForPayload(payload);

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: subject,
        message: body
      })
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);

    setStatus("Job card sent successfully!", "success");
    showSuccessScreen();
    resetFormAfterSend();
  } catch (error) {
    const mailtoUrl = `mailto:${recipients.join(",")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    setStatus(
      `Could not send automatically. Your email app has been opened as a fallback for: ${recipients.join(", ")}`,
      "error"
    );
  } finally {
    submitButton.disabled = false;
  }
});

hideSuccessScreen();
resetFormAfterSend();
window.addEventListener("pageshow", () => hideSuccessScreen());
updateSummary();
