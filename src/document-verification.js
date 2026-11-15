import {
  verificationCopy,
  officialVerificationRoutes,
  academicDocumentTypes,
  myCredsInstitutions,
  resolveOfficialVerificationRoute,
  reviewedOfficialUrl,
  createVerificationState,
  markRequestedByStudent
} from './official-verification.js';
import {programAcceptance} from './program-acceptance.js';
import {researchScholarships} from './research-catalog.js';

// Dashboard panel for the reviewed official routes. Guided only: no provider
// API, no document identifiers, no share links, and no status promotion.
const el = (tag, text) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
};
const locale = language => language === 'fa' ? 'fa-AF' : language === 'ps' ? 'ps-AF' : 'en';
let mounts = 0;

export function mountDocumentVerification(container, { language = 'en', documentId = '' } = {}) {
  if (!container) return null;
  const t = verificationCopy[language] ?? verificationCopy.en;
  const suffix = `${documentId || 'record'}-${++mounts}`;
  let state = createVerificationState();
  container.replaceChildren();

  const section = el('section');
  section.className = 'document-verification';
  section.setAttribute('aria-labelledby', `verification-title-${suffix}`);
  const title = el('h3', t.panelTitle);
  title.id = `verification-title-${suffix}`;
  title.tabIndex = -1;
  const intro = el('p', t.intro);
  intro.className = 'verification-intro';
  section.append(title, intro);

  const status = el('div');
  status.className = 'verification-status';
  status.setAttribute('role', 'group');
  status.setAttribute('aria-label', t.statusTitle);
  const statusList = el('dl');
  status.append(statusList);
  const statusRow = (label, value) => {
    const row = el('div');
    row.className = 'verification-status-row';
    const term = el('dt', label);
    const detail = el('dd', value);
    row.append(term, detail);
    statusList.append(row);
    return detail;
  };
  statusRow(t.authenticity, t.authenticityValue);
  statusRow(t.identity, t.identityValue);
  const acceptanceValue = statusRow(t.acceptance, t.acceptanceValue);
  const requestValue = statusRow(t.request, t.requestValue);
  section.append(status);

  const controls = el('div');
  controls.className = 'verification-controls';
  const typeLabel = el('label', t.docTypeLabel);
  const typeSelect = el('select');
  typeSelect.id = `verification-type-${suffix}`;
  typeLabel.htmlFor = typeSelect.id;
  const placeholder = el('option', t.docTypePlaceholder);
  placeholder.value = '';
  typeSelect.append(placeholder);
  const languageGroup = el('optgroup');
  languageGroup.label = t.groupLanguage;
  for (const route of officialVerificationRoutes) {
    for (const variant of route.variants) {
      const option = el('option', variant);
      option.value = `test|${variant}`;
      languageGroup.append(option);
    }
  }
  typeSelect.append(languageGroup);
  const academicGroup = el('optgroup');
  academicGroup.label = t.groupAcademic;
  const documentTypeLabels = {
    official_transcript: t.docTranscript,
    enrolment_verification_letter: t.docEnrolment,
    degree_certificate: t.docDegree
  };
  for (const type of academicDocumentTypes) {
    const option = el('option', documentTypeLabels[type]);
    option.value = `doc|${type}`;
    academicGroup.append(option);
  }
  typeSelect.append(academicGroup);
  const otherOption = el('option', t.testOther);
  otherOption.value = 'other';
  typeSelect.append(otherOption);
  typeLabel.append(typeSelect);

  const issuerLabel = el('label', t.issuerLabel);
  const issuerSelect = el('select');
  issuerSelect.id = `verification-issuer-${suffix}`;
  issuerLabel.htmlFor = issuerSelect.id;
  const unknownIssuer = el('option', t.issuerUnknown);
  unknownIssuer.value = '';
  issuerSelect.append(unknownIssuer);
  for (const institution of myCredsInstitutions) {
    const option = el('option', institution.name);
    option.value = institution.id;
    option.dir = 'ltr';
    issuerSelect.append(option);
  }
  issuerLabel.append(issuerSelect);
  issuerLabel.hidden = true;
  const programLabel = el('label', t.programLabel);
  const programSelect = el('select');
  programSelect.id = `verification-program-${suffix}`;
  programLabel.htmlFor = programSelect.id;
  const noProgram = el('option', t.programNone);
  noProgram.value = '';
  programSelect.append(noProgram);
  for (const program of researchScholarships) {
    const option = el('option', program.title);
    option.value = program.id;
    option.dir = 'ltr';
    programSelect.append(option);
  }
  programLabel.append(programSelect);
  programLabel.hidden = true;
  controls.append(typeLabel, issuerLabel, programLabel);
  section.append(controls);
  const acceptanceEvidence = el('div');
  acceptanceEvidence.className = 'verification-acceptance-region';
  section.append(acceptanceEvidence);

  const routeRegion = el('div');
  routeRegion.className = 'verification-route-region';
  routeRegion.setAttribute('aria-live', 'polite');
  section.append(routeRegion);

  const noteId = `verification-external-${suffix}`;
  const programNoteId = `verification-program-note-${suffix}`;
  const externalNote = el('p', t.externalNote);
  externalNote.id = noteId;
  externalNote.className = 'verification-external-note';

  // Route review dates are calendar dates; format in UTC so they never shift a day.
  const dateFormat = new Intl.DateTimeFormat(locale(language), { dateStyle: 'medium', timeZone: 'UTC' });
  const routeKindLabel = {
    official_delivery: t.kindOfficialDelivery,
    issuer_verification: t.kindIssuerVerification,
    issuer_contact: t.kindIssuerContact
  };
  const sourceName = url => {
    const safe = reviewedOfficialUrl(url);
    return safe ? new URL(safe).hostname : '';
  };

  function makeLink(url, label, describedBy = noteId) {
    const safe = reviewedOfficialUrl(url);
    if (!safe) return null;
    const link = el('a', `${label} ↗`);
    link.className = 'verification-link';
    link.href = safe;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.referrerPolicy = 'no-referrer';
    link.setAttribute('aria-describedby', describedBy);
    return link;
  }

  function addTemplate(card) {
    const block = el('div');
    block.className = 'verification-template';
    block.append(el('h5', t.templateTitle), el('p', t.templateNote));
    const area = el('textarea');
    area.readOnly = true;
    area.rows = 8;
    area.dir = 'auto';
    area.value = t.templateBody;
    area.className = 'verification-template-text';
    area.setAttribute('aria-label', t.templateTitle);
    const copy = el('button', t.copyTemplate);
    copy.type = 'button';
    copy.className = 'verification-copy';
    copy.addEventListener('click', async () => {
      let copied = false;
      try {
        await navigator.clipboard.writeText(t.templateBody);
        copied = true;
      } catch {
        area.focus();
        area.select();
        try {
          copied = document.execCommand('copy');
        } catch {
          copied = false;
        }
      }
      copy.textContent = copied ? t.copied : t.copyTemplate;
      if (copied) setTimeout(() => { copy.textContent = t.copyTemplate; }, 2500);
    });
    block.append(area, copy);
    card.append(block);
  }

  function addRequestMarker(card) {
    const wrap = el('div');
    wrap.className = 'verification-request';
    const mark = el('button', t.markRequested);
    mark.type = 'button';
    mark.className = 'verification-mark';
    mark.addEventListener('click', () => {
      state = markRequestedByStudent(state);
      requestValue.textContent = t.requestMarked;
      mark.disabled = true;
      mark.setAttribute('aria-pressed', 'true');
    });
    mark.setAttribute('aria-pressed', 'false');
    wrap.append(mark, el('p', t.markNote));
    card.append(wrap);
  }

  function renderAcceptance(acceptance, selectedVariant) {
    acceptanceEvidence.replaceChildren();
    if (acceptance.status === 'confirmed') {
      const block = el('section');
      block.className = 'verification-acceptance';
      block.append(el('h5', t.programAcceptanceSource));
      const program = el('p', `${acceptance.program.title} — ${acceptance.program.provider}`);
      program.className = 'verification-acceptance-program';
      program.dir = 'auto';
      const quote = el('blockquote', acceptance.sourceExcerpt);
      quote.dir = 'ltr';
      quote.lang = 'en';
      const link = makeLink(acceptance.sourceUrl, t.openProgramSource, programNoteId);
      const reviewed = el('p', `${t.reviewedLabel} ${dateFormat.format(new Date(acceptance.reviewedAt))}`);
      reviewed.className = 'verification-reviewed';
      const note = el('p', t.programAcceptanceNote);
      note.id = programNoteId;
      note.className = 'verification-acceptance-note';
      block.append(program, quote);
      if (link) {
        const sourceRow = el('p');
        sourceRow.className = 'verification-source';
        sourceRow.append(link);
        const host = sourceName(acceptance.sourceUrl);
        if (host) {
          const label = el('span', `${t.sourceLabel}: ${host}`);
          label.dir = 'ltr';
          sourceRow.append(label);
        }
        block.append(sourceRow);
      }
      block.append(reviewed, note);
      acceptanceEvidence.append(block);
      return;
    }
    if (selectedVariant && acceptance.program && acceptance.reason === 'exact_credential_not_named') {
      const note = el('p', t.programAcceptanceMismatch);
      note.className = 'verification-acceptance-note';
      acceptanceEvidence.append(note);
    }
  }

  function renderCard(route) {
    const copy = t.routes[route.id] ?? t.routes.unconfirmed;
    const card = el('article');
    card.className = 'verification-card';
    card.dataset.route = route.id;
    card.dataset.confirmed = String(!!route.confirmed);
    const kind = el('p', routeKindLabel[route.routeKind] ?? t.kindIssuerContact);
    kind.className = 'verification-kind';
    const heading = el('h4', route.institution ? `${copy.name} · ${route.institution}` : copy.name);
    heading.dir = 'auto';
    card.append(kind, heading, el('p', copy.summary));

    const facts = el('dl');
    facts.className = 'verification-facts';
    const fact = (label, value) => {
      const row = el('div');
      const term = el('dt', label);
      const detail = el('dd', value);
      detail.dir = 'auto';
      row.append(term, detail);
      facts.append(row);
    };
    fact(t.whoLabel, copy.who);
    fact(t.nextLabel, copy.next);
    card.append(facts);

    if (route.confirmed) {
      const link = makeLink(route.sourceUrl, t.openOfficial);
      if (link) {
        const row = el('p');
        row.className = 'verification-source';
        row.append(link);
        const source = sourceName(route.sourceUrl);
        if (source) {
          const label = el('span', `${t.sourceLabel}: ${source}`);
          label.dir = 'ltr';
          row.append(label);
        }
        card.append(row);
      }
      const organisation = makeLink(route.organisationUrl, t.organisationGuide);
      if (organisation) {
        const row = el('p');
        row.className = 'verification-source';
        row.append(organisation);
        card.append(row);
      }
      card.append(externalNote);
      if (route.id === 'mycreds') card.append(el('p', t.myCredsCaution));
      const reviewed = el('p', `${t.reviewedLabel} ${dateFormat.format(new Date(route.reviewedAt))}`);
      reviewed.className = 'verification-reviewed';
      card.append(reviewed);
      addRequestMarker(card);
    } else {
      card.append(el('p', route.id === 'registrar' ? t.noRoute : t.unconfirmedTest));
      card.append(el('p', t.noRouteNext), el('p', t.stillUsable));
      addTemplate(card);
    }
    routeRegion.append(card);
  }

  function render() {
    routeRegion.replaceChildren();
    const value = typeSelect.value;
    const selectedVariant = value.startsWith('test|') ? value.slice(5) : null;
    const isDocument = value.startsWith('doc|');
    issuerLabel.hidden = !isDocument;
    programLabel.hidden = !selectedVariant;
    let route = null;
    if (selectedVariant) route = resolveOfficialVerificationRoute({ test: selectedVariant });
    else if (isDocument) route = resolveOfficialVerificationRoute({ documentType: value.slice(4), institutionId: issuerSelect.value });
    else if (value === 'other') route = resolveOfficialVerificationRoute({ documentType: 'other' });
    const acceptance = programAcceptance({ programId: programSelect.value, test: route?.test ?? null, variant: selectedVariant });
    acceptanceValue.textContent = acceptance.status === 'confirmed' ? t.programAcceptanceConfirmed : t.acceptanceValue;
    renderAcceptance(acceptance, selectedVariant);
    if (!route) {
      const prompt = el('p', t.choosePrompt);
      prompt.className = 'verification-prompt';
      routeRegion.append(prompt);
      return;
    }
    renderCard(route);
  }

  const independence = el('p', t.independenceNote);
  independence.className = 'verification-independence';
  section.append(independence);
  typeSelect.addEventListener('change', render);
  issuerSelect.addEventListener('change', render);
  programSelect.addEventListener('change', render);
  container.append(section);
  render();
  return { focus: () => title.focus(), state: () => state };
}
