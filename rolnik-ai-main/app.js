// Rolnik AI - Panel gospodarstwa
(function () {
  'use strict';

  // --- Initial Data / Storage ---
  const STORAGE_KEY = 'rolnik_ai_farm_data_v1';

  const defaultData = {
    fields: [
      { id: 'f1', name: 'Za Stodołą', crop: 'Pszenica ozima', area: 4.8, cadastral: '124/2' },
      { id: 'f2', name: 'Pole Północne', crop: 'Rzepak ozimy', area: 7.5, cadastral: '89/1' },
      { id: 'f3', name: 'Działka pod Lasem', crop: 'Kukurydza na ziarno', area: 3.2, cadastral: '204' }
    ],
    machines: [
      { id: 'm1', name: 'John Deere 6120M', type: 'Ciągnik', power: '120 KM' },
      { id: 'm2', name: 'Ursus C-360', type: 'Ciągnik', power: '52 KM' },
      { id: 'm3', name: 'Krukowiak Apollo 1200', type: 'Opryskiwacz', power: '-' }
    ],
    history: [
      {
        id: 'h1',
        title: 'Oprysk fungicydowy T1',
        type: 'Oprysk',
        date: new Date().toISOString().split('T')[0],
        field: 'Pole Północne',
        machine: 'John Deere 6120M',
        product: 'Priaxor',
        dosage: '0.8 l/ha',
        fuel: 22,
        cost: 650,
        notes: 'Zabieg wykonany rano przy bezwietrznej pogodzie.'
      },
      {
        id: 'h2',
        title: 'Orka głęboka',
        type: 'Orka',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        field: 'Za Stodołą',
        machine: 'Ursus C-360',
        product: '',
        dosage: '',
        fuel: 48,
        cost: 320,
        notes: 'Stan gleby optymalny.'
      }
    ],
    costs: [
      { id: 'c1', title: 'Olej napędowy (paliwo)', category: 'Paliwo', amount: 320, date: new Date().toISOString().split('T')[0] },
      { id: 'c2', title: 'Środek Priaxor', category: 'Środki ochrony', amount: 650, date: new Date().toISOString().split('T')[0] }
    ]
  };

  function loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Błąd odczytu localStorage:', e);
    }
    return defaultData;
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Błąd zapisu localStorage:', e);
    }
  }

  let farmData = loadData();

  // --- DOM Elements ---
  const screens = document.querySelectorAll('.screen');
  const navButtons = document.querySelectorAll('[data-nav]');
  const micBtn = document.getElementById('micBtn');
  const micLabel = document.getElementById('micLabel');
  const liveTranscript = document.getElementById('liveTranscript');
  const todayCountEl = document.getElementById('todayCount');
  const fieldCountEl = document.getElementById('fieldCount');
  const areaCountEl = document.getElementById('areaCount');
  const historyList = document.getElementById('historyList');
  const fieldList = document.getElementById('fieldList');
  const machineList = document.getElementById('machineList');
  const costList = document.getElementById('costList');
  const clearHistoryBtn = document.getElementById('clearHistory');
  const addFieldBtn = document.getElementById('addField');
  const addMachineBtn = document.getElementById('addMachine');
  const modal = document.getElementById('modal');
  const parsedForm = document.getElementById('parsedForm');
  const cancelModalBtn = document.getElementById('cancelModal');
  const saveEntryBtn = document.getElementById('saveEntry');
  const toast = document.getElementById('toast');
  const installBtn = document.getElementById('installBtn');

  let currentModalMode = 'entry'; // 'entry' | 'field' | 'machine'

  // --- Toast ---
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // --- Navigation ---
  function navigateTo(screenId) {
    screens.forEach((s) => {
      if (s.id === screenId) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });

    document.querySelectorAll('.bottom button').forEach((btn) => {
      if (btn.getAttribute('data-nav') === screenId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = btn.getAttribute('data-nav');
      if (target) {
        navigateTo(target);
      }
    });
  });

  // --- Stats Calculation ---
  function updateStats() {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayEntries = farmData.history.filter((h) => h.date === todayStr);

    if (todayCountEl) todayCountEl.textContent = todayEntries.length.toString();
    if (fieldCountEl) fieldCountEl.textContent = farmData.fields.length.toString();

    const totalArea = farmData.fields.reduce((acc, f) => acc + (parseFloat(f.area) || 0), 0);
    if (areaCountEl) areaCountEl.textContent = totalArea.toFixed(1).replace('.0', '') + ' ha';
  }

  // --- Render Lists ---
  function renderHistory() {
    if (!historyList) return;
    historyList.innerHTML = '';

    if (farmData.history.length === 0) {
      historyList.innerHTML = `
        <div class="emptyState">
          <b>Brak zarejestrowanych prac</b>
          <p>Użyj mikrofonu na ekranie startowym, aby dodać pierwszy wpis.</p>
        </div>`;
      return;
    }

    farmData.history.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'itemCard';

      let badgeClass = 'badge';
      if (item.type === 'Orka') badgeClass += ' badge-orka';
      else if (item.type === 'Oprysk') badgeClass += ' badge-oprysk';
      else if (item.type === 'Siew') badgeClass += ' badge-siew';

      card.innerHTML = `
        <div class="itemCardHeader">
          <div>
            <span class="${badgeClass}">${item.type || 'Praca polowa'}</span>
            <div class="itemTitle">${item.title}</div>
          </div>
          <div class="itemDate">${item.date || ''}</div>
        </div>
        <div class="itemDetails">
          ${item.field ? `<span>📍 <b>Działka:</b> ${item.field}</span>` : ''}
          ${item.machine ? `<span>🚜 <b>Maszyna:</b> ${item.machine}</span>` : ''}
          ${item.product ? `<span>🧪 <b>Środek:</b> ${item.product} (${item.dosage || ''})</span>` : ''}
          ${item.fuel ? `<span>⛽ <b>Paliwo:</b> ${item.fuel} L</span>` : ''}
          ${item.cost ? `<span>💰 <b>Koszt:</b> ${item.cost} zł</span>` : ''}
        </div>
        ${item.notes ? `<div style="margin-top:8px; font-size:0.82rem; color:#6b7280; font-style:italic;">"${item.notes}"</div>` : ''}
      `;
      historyList.appendChild(card);
    });
  }

  function renderFields() {
    if (!fieldList) return;
    fieldList.innerHTML = '';

    if (farmData.fields.length === 0) {
      fieldList.innerHTML = `
        <div class="emptyState">
          <b>Brak dodanych działek</b>
          <p>Kliknij przycisk "+ Dodaj", aby wprowadzić pierwszą działkę.</p>
        </div>`;
      return;
    }

    farmData.fields.forEach((f, idx) => {
      const card = document.createElement('div');
      card.className = 'itemCard';
      card.innerHTML = `
        <div class="itemCardHeader">
          <div>
            <span class="badge" style="background:#e0f2fe; color:#0369a1;">Działka #${idx + 1}</span>
            <div class="itemTitle">📍 ${f.name}</div>
          </div>
          <div style="font-weight:800; font-size:1.15rem; color:#16351f;">${f.area} ha</div>
        </div>
        <div class="itemDetails">
          <span>🌱 <b>Uprawa:</b> ${f.crop || 'Brak'}</span>
          ${f.cadastral ? `<span>📄 <b>Nr działki:</b> ${f.cadastral}</span>` : ''}
        </div>
      `;
      fieldList.appendChild(card);
    });
  }

  function renderMachines() {
    if (!machineList) return;
    machineList.innerHTML = '';

    if (farmData.machines.length === 0) {
      machineList.innerHTML = `
        <div class="emptyState">
          <b>Brak maszyn w bazie</b>
          <p>Dodaj swój ciągnik lub sprzęt rolniczy przyciskiem "+ Dodaj".</p>
        </div>`;
      return;
    }

    farmData.machines.forEach((m) => {
      const card = document.createElement('div');
      card.className = 'itemCard';
      card.innerHTML = `
        <div class="itemCardHeader">
          <div>
            <span class="badge" style="background:#fef3c7; color:#92400e;">${m.type || 'Sprzęt'}</span>
            <div class="itemTitle">🚜 ${m.name}</div>
          </div>
          <div style="font-size:0.85rem; color:#6b7280;">${m.power || ''}</div>
        </div>
      `;
      machineList.appendChild(card);
    });
  }

  function renderCosts() {
    if (!costList) return;
    costList.innerHTML = '';

    let total = 0;
    // Costs from explicit costs array + entries with costs
    const allCosts = [...farmData.costs];

    farmData.history.forEach((h) => {
      if (h.cost && parseFloat(h.cost) > 0) {
        allCosts.push({
          id: 'hc_' + h.id,
          title: h.title,
          category: h.type || 'Praca polowa',
          amount: parseFloat(h.cost),
          date: h.date
        });
      }
    });

    if (allCosts.length === 0) {
      costList.innerHTML = `
        <div class="emptyState">
          <b>Brak zarejestrowanych kosztów</b>
          <p>Koszty paliwa, środków ochrony i nawozów pojawią się tutaj automatycznie.</p>
        </div>`;
      return;
    }

    allCosts.forEach((c) => {
      total += parseFloat(c.amount) || 0;
      const card = document.createElement('div');
      card.className = 'itemCard';
      card.innerHTML = `
        <div class="itemCardHeader">
          <div>
            <span class="badge badge-koszt">${c.category || 'Wydatek'}</span>
            <div class="itemTitle">${c.title}</div>
          </div>
          <div style="font-weight:800; font-size:1.1rem; color:#b91c1c;">${c.amount} zł</div>
        </div>
        <div class="itemDetails">
          <span>📅 Data: ${c.date || ''}</span>
        </div>
      `;
      costList.appendChild(card);
    });

    const sumSummary = document.createElement('div');
    sumSummary.className = 'card';
    sumSummary.style.marginTop = '8px';
    sumSummary.style.background = '#fef2f2';
    sumSummary.style.borderColor = '#fecaca';
    sumSummary.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <b>Suma zarejestrowanych wydatków:</b>
        <span style="font-size:1.3rem; font-weight:800; color:#b91c1c;">${total.toFixed(2)} zł</span>
      </div>
    `;
    costList.prepend(sumSummary);
  }

  function refreshAll() {
    updateStats();
    renderHistory();
    renderFields();
    renderMachines();
    renderCosts();
  }

  // --- Voice / Text NLP Parsing ---
  function parseFarmVoiceText(rawText) {
    const text = rawText.toLowerCase();

    // Determine type
    let type = 'Inne';
    if (text.includes('oprysk') || text.includes('pryska') || text.includes('zabieg')) {
      type = 'Oprysk';
    } else if (text.includes('orał') || text.includes('orka') || text.includes('oranie') || text.includes('zaorałem')) {
      type = 'Orka';
    } else if (text.includes('siew') || text.includes('siał') || text.includes('zasiałem')) {
      type = 'Siew';
    } else if (text.includes('nawóz') || text.includes('nawozi') || text.includes('saletr') || text.includes('mocznik')) {
      type = 'Nawożenie';
    } else if (text.includes('kosi') || text.includes('koszenie') || text.includes('skosiłem')) {
      type = 'Koszenie';
    } else if (text.includes('talerz') || text.includes('talerzowanie')) {
      type = 'Talerzowanie';
    } else if (text.includes('kultywat') || text.includes('kultywacja')) {
      type = 'Kultywacja';
    }

    // Match Field
    let matchedField = farmData.fields[0] ? farmData.fields[0].name : 'Pole główne';
    for (const f of farmData.fields) {
      if (text.includes(f.name.toLowerCase())) {
        matchedField = f.name;
        break;
      }
    }

    // Match Machine
    let matchedMachine = farmData.machines[0] ? farmData.machines[0].name : '';
    for (const m of farmData.machines) {
      if (text.includes(m.name.toLowerCase()) || text.includes('ursus') && m.name.toLowerCase().includes('ursus') || text.includes('john deere') && m.name.toLowerCase().includes('john deere')) {
        matchedMachine = m.name;
        break;
      }
    }

    // Numbers: fuel, cost, dosage
    let fuel = '';
    const fuelMatch = text.match(/(\d+[\.,]?\d*)\s*(litr|l|ropy)/i);
    if (fuelMatch) {
      fuel = fuelMatch[1].replace(',', '.');
    }

    let cost = '';
    const costMatch = text.match(/(\d+[\.,]?\d*)\s*(zł|złotych|pln)/i);
    if (costMatch) {
      cost = costMatch[1].replace(',', '.');
    }

    let dosage = '';
    const dosageMatch = text.match(/(\d+[\.,]?\d*)\s*(l\/ha|kg\/ha|litr|kg)/i);
    if (dosageMatch) {
      dosage = dosageMatch[0];
    }

    let product = '';
    const products = ['priaxor', 'mustang', 'roundup', 'saletra', 'mocznik', 'polifoska', 'duet na start', 'adengo'];
    for (const p of products) {
      if (text.includes(p)) {
        product = p.charAt(0).toUpperCase() + p.slice(1);
        break;
      }
    }

    let title = `${type} - ${matchedField}`;
    if (product) {
      title = `${type} (${product}) - ${matchedField}`;
    }

    return {
      type,
      title,
      field: matchedField,
      machine: matchedMachine,
      product,
      dosage,
      fuel: fuel ? parseFloat(fuel) : '',
      cost: cost ? parseFloat(cost) : (fuel ? Math.round(parseFloat(fuel) * 6.5) : ''),
      notes: rawText,
      date: new Date().toISOString().split('T')[0]
    };
  }

  // --- Modal Handling ---
  function openEntryModal(parsedData) {
    currentModalMode = 'entry';
    modal.classList.remove('hidden');

    const fieldsOptions = farmData.fields
      .map((f) => `<option value="${f.name}" ${f.name === parsedData.field ? 'selected' : ''}>${f.name} (${f.crop || 'działka'})</option>`)
      .join('');

    const machinesOptions = farmData.machines
      .map((m) => `<option value="${m.name}" ${m.name === parsedData.machine ? 'selected' : ''}>${m.name}</option>`)
      .join('');

    parsedForm.innerHTML = `
      <div class="formGroup">
        <label>Tytuł wpisu</label>
        <input type="text" id="formTitle" value="${parsedData.title || ''}" required />
      </div>
      <div class="formGrid">
        <div class="formGroup">
          <label>Kategoria prac</label>
          <select id="formType">
            <option value="Orka" ${parsedData.type === 'Orka' ? 'selected' : ''}>Orka</option>
            <option value="Oprysk" ${parsedData.type === 'Oprysk' ? 'selected' : ''}>Oprysk</option>
            <option value="Siew" ${parsedData.type === 'Siew' ? 'selected' : ''}>Siew</option>
            <option value="Nawożenie" ${parsedData.type === 'Nawożenie' ? 'selected' : ''}>Nawożenie</option>
            <option value="Koszenie" ${parsedData.type === 'Koszenie' ? 'selected' : ''}>Koszenie</option>
            <option value="Talerzowanie" ${parsedData.type === 'Talerzowanie' ? 'selected' : ''}>Talerzowanie</option>
            <option value="Kultywacja" ${parsedData.type === 'Kultywacja' ? 'selected' : ''}>Kultywacja</option>
            <option value="Inne" ${parsedData.type === 'Inne' ? 'selected' : ''}>Inne</option>
          </select>
        </div>
        <div class="formGroup">
          <label>Data</label>
          <input type="date" id="formDate" value="${parsedData.date || new Date().toISOString().split('T')[0]}" />
        </div>
      </div>
      <div class="formGrid">
        <div class="formGroup">
          <label>Działka</label>
          <select id="formField">
            ${fieldsOptions}
          </select>
        </div>
        <div class="formGroup">
          <label>Maszyna</label>
          <select id="formMachine">
            <option value="">-- Brak --</option>
            ${machinesOptions}
          </select>
        </div>
      </div>
      <div class="formGrid">
        <div class="formGroup">
          <label>Środek / Materiał</label>
          <input type="text" id="formProduct" placeholder="np. Priaxor, Saletra" value="${parsedData.product || ''}" />
        </div>
        <div class="formGroup">
          <label>Dawka</label>
          <input type="text" id="formDosage" placeholder="np. 0.8 l/ha, 200 kg/ha" value="${parsedData.dosage || ''}" />
        </div>
      </div>
      <div class="formGrid">
        <div class="formGroup">
          <label>Zużyte paliwo (L)</label>
          <input type="number" id="formFuel" placeholder="np. 40" value="${parsedData.fuel || ''}" />
        </div>
        <div class="formGroup">
          <label>Koszt orientacyjny (zł)</label>
          <input type="number" id="formCost" placeholder="np. 250" value="${parsedData.cost || ''}" />
        </div>
      </div>
      <div class="formGroup">
        <label>Notatki / Oryginalna wypowiedź</label>
        <textarea id="formNotes" rows="2">${parsedData.notes || ''}</textarea>
      </div>
    `;
  }

  function openAddFieldModal() {
    currentModalMode = 'field';
    modal.classList.remove('hidden');

    parsedForm.innerHTML = `
      <div class="formGroup">
        <label>Nazwa działki</label>
        <input type="text" id="newFieldName" placeholder="np. Za Lasem, Pole Północne" required />
      </div>
      <div class="formGrid">
        <div class="formGroup">
          <label>Powierzchnia (ha)</label>
          <input type="number" step="0.1" id="newFieldArea" placeholder="np. 5.5" required />
        </div>
        <div class="formGroup">
          <label>Uprawa</label>
          <input type="text" id="newFieldCrop" placeholder="np. Pszenica ozima" />
        </div>
      </div>
      <div class="formGroup">
        <label>Numer ewidencyjny / działki</label>
        <input type="text" id="newFieldCadastral" placeholder="np. 142/3" />
      </div>
    `;
  }

  function openAddMachineModal() {
    currentModalMode = 'machine';
    modal.classList.remove('hidden');

    parsedForm.innerHTML = `
      <div class="formGroup">
        <label>Nazwa maszyny / ciągnika</label>
        <input type="text" id="newMachineName" placeholder="np. John Deere 6120M" required />
      </div>
      <div class="formGrid">
        <div class="formGroup">
          <label>Typ sprzętu</label>
          <select id="newMachineType">
            <option value="Ciągnik">Ciągnik</option>
            <option value="Opryskiwacz">Opryskiwacz</option>
            <option value="Kombajn">Kombajn</option>
            <option value="Pług">Pług</option>
            <option value="Siewnik">Siewnik</option>
            <option value="Agregat">Agregat</option>
            <option value="Przyczepa">Przyczepa</option>
            <option value="Inne">Inne</option>
          </select>
        </div>
        <div class="formGroup">
          <label>Moc / Rocznik</label>
          <input type="text" id="newMachinePower" placeholder="np. 120 KM, 2021" />
        </div>
      </div>
    `;
  }

  function closeModal() {
    modal.classList.add('hidden');
    parsedForm.innerHTML = '';
  }

  if (cancelModalBtn) {
    cancelModalBtn.addEventListener('click', closeModal);
  }

  if (saveEntryBtn) {
    saveEntryBtn.addEventListener('click', () => {
      if (currentModalMode === 'entry') {
        const title = document.getElementById('formTitle')?.value.trim();
        if (!title) {
          showToast('Proszę podać tytuł wpisu');
          return;
        }

        const newEntry = {
          id: 'h_' + Date.now(),
          title: title,
          type: document.getElementById('formType')?.value || 'Praca polowa',
          date: document.getElementById('formDate')?.value || new Date().toISOString().split('T')[0],
          field: document.getElementById('formField')?.value || '',
          machine: document.getElementById('formMachine')?.value || '',
          product: document.getElementById('formProduct')?.value.trim() || '',
          dosage: document.getElementById('formDosage')?.value.trim() || '',
          fuel: parseFloat(document.getElementById('formFuel')?.value) || '',
          cost: parseFloat(document.getElementById('formCost')?.value) || '',
          notes: document.getElementById('formNotes')?.value.trim() || ''
        };

        farmData.history.unshift(newEntry);
        saveData(farmData);
        refreshAll();
        closeModal();
        showToast('✓ Wpis został pomyślnie zapisany');
      } else if (currentModalMode === 'field') {
        const name = document.getElementById('newFieldName')?.value.trim();
        const area = parseFloat(document.getElementById('newFieldArea')?.value);
        const crop = document.getElementById('newFieldCrop')?.value.trim();
        const cadastral = document.getElementById('newFieldCadastral')?.value.trim();

        if (!name || isNaN(area) || area <= 0) {
          showToast('Podaj poprawną nazwę i areał działki');
          return;
        }

        farmData.fields.push({
          id: 'f_' + Date.now(),
          name,
          area,
          crop: crop || 'Brak',
          cadastral: cadastral || ''
        });

        saveData(farmData);
        refreshAll();
        closeModal();
        showToast('✓ Dodano nową działkę: ' + name);
      } else if (currentModalMode === 'machine') {
        const name = document.getElementById('newMachineName')?.value.trim();
        const type = document.getElementById('newMachineType')?.value || 'Ciągnik';
        const power = document.getElementById('newMachinePower')?.value.trim() || '';

        if (!name) {
          showToast('Podaj nazwę maszyny');
          return;
        }

        farmData.machines.push({
          id: 'm_' + Date.now(),
          name,
          type,
          power
        });

        saveData(farmData);
        refreshAll();
        closeModal();
        showToast('✓ Dodano maszynę: ' + name);
      }
    });
  }

  // --- Add Action Buttons ---
  if (addFieldBtn) {
    addFieldBtn.addEventListener('click', openAddFieldModal);
  }

  if (addMachineBtn) {
    addMachineBtn.addEventListener('click', openAddMachineModal);
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      if (confirm('Czy na pewno chcesz wyczyścić historię prac?')) {
        farmData.history = [];
        saveData(farmData);
        refreshAll();
        showToast('Historia prac została wyczyszczona');
      }
    });
  }

  // --- Voice Recording & Input Flow ---
  let recognition = null;
  let isRecording = false;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'pl-PL';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      isRecording = true;
      if (micBtn) micBtn.classList.add('recording');
      if (micLabel) micLabel.textContent = 'Słucham... powiedz, co zrobiłeś';
      if (liveTranscript) {
        liveTranscript.classList.remove('hidden');
        liveTranscript.innerHTML = '<i>Mów teraz wyraźnie...</i>';
      }
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const text = final || interim;
      if (liveTranscript && text) {
        liveTranscript.textContent = text;
      }

      if (final) {
        const parsed = parseFarmVoiceText(final);
        setTimeout(() => {
          openEntryModal(parsed);
          if (liveTranscript) liveTranscript.classList.add('hidden');
        }, 500);
      }
    };

    recognition.onerror = (e) => {
      console.warn('SpeechRecognition error:', e);
      stopRecording();
      showFallbackInput('Nie udało się rozpoznać głosu. Możesz wpisać treść ręcznie:');
    };

    recognition.onend = () => {
      stopRecording();
    };
  }

  function stopRecording() {
    isRecording = false;
    if (micBtn) micBtn.classList.remove('recording');
    if (micLabel) micLabel.textContent = 'Powiedz, co dzisiaj zrobiłeś';
  }

  function showFallbackInput(promptMsg) {
    if (!liveTranscript) return;
    liveTranscript.classList.remove('hidden');
    liveTranscript.innerHTML = `
      <div style="font-size:0.85rem; margin-bottom:8px; color:#065f46;">${promptMsg || 'Wpisz treść pracy lub zabiegu:'}</div>
      <div style="display:flex; gap:8px;">
        <input type="text" id="manualTextInput" placeholder="np. Zaorałem pole Za Stodołą ciągnikiem Ursus, poszło 40 litrów" style="flex:1; padding:8px 12px; border:1px solid #6ee7b7; border-radius:6px; font-size:0.88rem;" />
        <button id="manualSubmitBtn" style="background:#16351f; color:#fff; border:none; padding:8px 14px; border-radius:6px; font-weight:700; cursor:pointer;">OK</button>
      </div>
    `;

    const input = document.getElementById('manualTextInput');
    const submit = document.getElementById('manualSubmitBtn');

    if (input) input.focus();

    const handleSubmit = () => {
      const val = input ? input.value.trim() : '';
      if (val) {
        const parsed = parseFarmVoiceText(val);
        openEntryModal(parsed);
        liveTranscript.classList.add('hidden');
      }
    };

    if (submit) submit.addEventListener('click', handleSubmit);
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSubmit();
      });
    }
  }

  if (micBtn) {
    micBtn.addEventListener('click', () => {
      if (recognition) {
        if (isRecording) {
          recognition.stop();
        } else {
          try {
            recognition.start();
          } catch (err) {
            console.warn('Błąd startu mikrofonu:', err);
            showFallbackInput('Mikrofon jest niedostępny. Wpisz treść ręcznie:');
          }
        }
      } else {
        showFallbackInput('Rozpoznawanie mowy nie jest obsługiwane w tej przeglądarce. Wpisz pracę:');
      }
    });
  }

  // --- PWA Installation Prompt ---
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) {
      installBtn.classList.remove('hidden');
      installBtn.addEventListener('click', () => {
        installBtn.classList.add('hidden');
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
          deferredPrompt = null;
        });
      });
    }
  });

  // --- Initial Render ---
  refreshAll();
})();
