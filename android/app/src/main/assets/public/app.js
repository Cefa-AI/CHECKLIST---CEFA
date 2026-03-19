document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('checklist-form');
    const errorBanner = document.getElementById('error-message');
    const submitBtn = document.getElementById('btn-submit');
    const textObs = document.getElementById('q18');
    const charCount = document.getElementById('char-count');

    // Camera Elements
    const cameraInput = document.getElementById('camera-input');
    const btnCamera = document.getElementById('btn-camera');
    const photoGallery = document.getElementById('photo-gallery');
    const photoCountSpan = document.getElementById('photo-count');
    
    let photosArray = []; // base64 strings
    const MAX_PHOTOS = 10;

    // --- CAMERA LOGIC ---
    btnCamera.addEventListener('click', () => {
        if (photosArray.length >= MAX_PHOTOS) {
            alert('Você já atingiu o limite de ' + MAX_PHOTOS + ' fotos.');
            return;
        }
        cameraInput.click();
    });

    cameraInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        let availableSlots = MAX_PHOTOS - photosArray.length;
        const filesToAdd = files.slice(0, availableSlots);
        filesToAdd.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                photosArray.push(event.target.result);
                renderPhotos();
            };
            reader.readAsDataURL(file);
        });
        cameraInput.value = '';
    });

    function renderPhotos() {
        photoGallery.innerHTML = '';
        photoCountSpan.textContent = photosArray.length;
        photosArray.forEach((photoDataUrl, index) => {
            const thumbDiv = document.createElement('div');
            thumbDiv.className = 'photo-thumb';
            const img = document.createElement('img');
            img.src = photoDataUrl;
            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn-remove';
            removeBtn.type = 'button';
            removeBtn.innerHTML = 'X';
            removeBtn.onclick = () => {
                photosArray.splice(index, 1);
                renderPhotos();
            };
            thumbDiv.appendChild(img);
            thumbDiv.appendChild(removeBtn);
            photoGallery.appendChild(thumbDiv);
        });
    }

    // --- FORM LOGIC ---
    textObs.addEventListener('input', () => {
        const count = textObs.value.length;
        charCount.textContent = count;
        charCount.style.color = count >= 120 ? 'var(--error-color)' : 'var(--text-secondary)';
    });

    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
             const row = input.closest('.check-item-row') || input.closest('.form-group');
             if (row) row.classList.remove('has-error');
             errorBanner.classList.add('hidden');
        });
    });

    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        let isValid = true;

        const requiredInputs = form.querySelectorAll('input[required]:not([type="radio"]), select[required]');
        requiredInputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.closest('.form-group').classList.add('has-error');
                input.style.borderColor = 'var(--error-color)';
            } else {
                input.style.borderColor = '';
            }
        });

        const radioGroups = ['q5','q6','q7','q8','q9','q10','q11','q12','q13','q14','q15','q16'];
        radioGroups.forEach(groupName => {
            const checked = form.querySelector('input[name="' + groupName + '"]:checked');
            const row = form.querySelector('input[name="' + groupName + '"]').closest('.check-item-row');
            if (!checked) { isValid = false; row.classList.add('has-error'); }
            else { row.classList.remove('has-error'); }
        });

        if (!isValid) {
            errorBanner.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        errorBanner.classList.add('hidden');
        await generateAndSavePDF();
    });

    // --- PDF GENERATION (builds a full standalone HTML string, never touches DOM visibility) ---
    function buildFullPDFHtmlPage() {
        const fData = (dStr) => {
            if(!dStr) return '';
            const [y,m,d] = dStr.split('-');
            return d + '/' + m + '/' + y;
        };

        const q1 = fData(document.getElementById('q1').value);
        const q2 = document.getElementById('q2').value;
        const q3 = document.getElementById('q3').value;
        const q4 = document.getElementById('q4').value;
        const q17 = fData(document.getElementById('q17').value);
        const q18 = document.getElementById('q18').value || 'Nenhuma observação.';

        const radioLabels = {
            'q5': '5. Faróis, Setas e Lanternas',
            'q6': '6. Limpadores de para brisas',
            'q7': '7. Func. pisca alerta, Luz de ré/Freio e Alarme',
            'q8': '8. Sistema de freio',
            'q9': '9. Verificação do cardan',
            'q10': '10. Verificação dos cubos de roda',
            'q11': '11. Cinto de segurança',
            'q12': '12. Buzina',
            'q13': '13. Braço hidráulico, lança e articulação',
            'q14': '14. Estado geral dos pneus (Desgaste, Calibração)',
            'q15': '15. Bateria',
            'q16': '16. Ar condicionado'
        };

        let checklistRows = '';
        for (let q in radioLabels) {
            const checkedNode = document.querySelector('input[name="' + q + '"]:checked');
            const val = checkedNode ? checkedNode.value : '—';
            const color = val === 'SIM' ? '#27ae60' : (val === 'NÃO' ? '#e74c3c' : '#333');
            checklistRows += '<tr><td style="padding:8px 12px;border:1px solid #ddd;">' + radioLabels[q] + '</td><td style="padding:8px 12px;border:1px solid #ddd;text-align:center;font-weight:bold;color:' + color + ';">' + val + '</td></tr>';
        }

        let photosHtml = '';
        if (photosArray.length > 0) {
            photosHtml = '<div style="page-break-before:auto;margin-top:20px;"><h2 style="color:#333;font-size:16px;">Anexos e Fotos (' + photosArray.length + ')</h2><div style="display:flex;flex-wrap:wrap;gap:10px;">';
            photosArray.forEach((src, i) => {
                photosHtml += '<div style="width:48%;margin-bottom:10px;"><img src="' + src + '" style="width:100%;max-height:250px;object-fit:contain;border:1px solid #ccc;"/><p style="font-size:11px;color:#666;margin:4px 0 0 0;">Foto ' + (i+1) + '</p></div>';
            });
            photosHtml += '</div></div>';
        }

        // Full self-contained HTML page string – this is what html2pdf will render
        return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
            'body{font-family:Arial,sans-serif;color:#333;margin:0;padding:20px;background:#fff;}' +
            'h1{text-align:center;color:#222;margin-bottom:4px;font-size:22px;}' +
            'h2.sub{text-align:center;color:#666;font-size:14px;margin-top:0;margin-bottom:20px;}' +
            'table{width:100%;border-collapse:collapse;margin-bottom:16px;}' +
            'th{background:#f2f2f2;text-align:left;padding:8px 12px;border:1px solid #ddd;font-weight:600;}' +
            'td{padding:8px 12px;border:1px solid #ddd;}' +
            '.info-label{width:40%;color:#555;}' +
            '</style></head><body>' +
            '<h1>Relatório de Checklist Veicular</h1>' +
            '<h2 class="sub">Caminhões Munck</h2>' +
            '<table>' +
            '<tr><td class="info-label"><strong>1. Data da Verificação</strong></td><td>' + q1 + '</td></tr>' +
            '<tr><td class="info-label"><strong>2. Turno de inspeção</strong></td><td>' + q2 + '</td></tr>' +
            '<tr><td class="info-label"><strong>3. Nome do motorista</strong></td><td>' + q3 + '</td></tr>' +
            '<tr><td class="info-label"><strong>4. Patrimonio</strong></td><td>' + q4 + '</td></tr>' +
            '</table>' +
            '<table><tr><th style="width:70%;">Item de Inspeção</th><th style="width:30%;text-align:center;">Resposta</th></tr>' +
            checklistRows +
            '</table>' +
            '<table>' +
            '<tr><td class="info-label"><strong>17. Quando engraxado munck e patolas?</strong></td><td>' + q17 + '</td></tr>' +
            '<tr><td class="info-label"><strong>18. Observações</strong></td><td>' + q18 + '</td></tr>' +
            '</table>' +
            photosHtml +
            '</body></html>';
    }

    // --- SAVE TO FOLDER LOGIC ---
    // IndexedDB to remember the saved folder handle  
    function openDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open('ChecklistMunckDB', 1);
            req.onupgradeneeded = (e) => { e.target.result.createObjectStore('handles'); };
            req.onsuccess = (e) => resolve(e.target.result);
            req.onerror = () => reject();
        });
    }

    async function getSavedDirHandle() {
        try {
            const db = await openDB();
            return new Promise((resolve) => {
                const tx = db.transaction('handles', 'readonly');
                const store = tx.objectStore('handles');
                const req = store.get('checklistDir');
                req.onsuccess = async () => {
                    const handle = req.result;
                    if (!handle) return resolve(null);
                    try {
                        const perm = await handle.queryPermission({ mode: 'readwrite' });
                        if (perm === 'granted') return resolve(handle);
                        const newPerm = await handle.requestPermission({ mode: 'readwrite' });
                        resolve(newPerm === 'granted' ? handle : null);
                    } catch(e) { resolve(null); }
                };
                req.onerror = () => resolve(null);
            });
        } catch(e) { return null; }
    }

    async function saveDirHandle(handle) {
        try {
            const db = await openDB();
            const tx = db.transaction('handles', 'readwrite');
            tx.objectStore('handles').put(handle, 'checklistDir');
        } catch(e) {}
    }

    async function pickFolder() {
        // Tries to use showDirectoryPicker (Chrome/Edge desktop on localhost/HTTPS)
        if (window.showDirectoryPicker) {
            try {
                const rootHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
                // Create subdir "Checklist Veicular" inside chosen location
                const dirHandle = await rootHandle.getDirectoryHandle('Checklist Veicular', { create: true });
                await saveDirHandle(dirHandle);
                return dirHandle;
            } catch(e) {
                console.log('User cancelled folder picker', e);
                return null;
            }
        }
        return null;
    }

    async function saveToFolder(dirHandle, filename, blob) {
        const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
    }

    async function generateAndSavePDF() {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const filename = 'checklist-munck-' + dd + '-' + mm + '-' + yyyy + '.pdf';

        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Gerando... Aguarde';
        submitBtn.disabled = true;

        try {
            // Build full HTML page string – NOT a DOM element
            const htmlString = buildFullPDFHtmlPage();

            const opt = {
                margin:       10,
                filename:     filename,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, logging: false },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
            };

            // ---- CAPACITOR (Android Native App) ----
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
                const pdfBase64 = await html2pdf().set(opt).from(htmlString).output('datauristring');
                const base64Data = pdfBase64.split(',')[1];
                try {
                    await window.Capacitor.Plugins.Filesystem.writeFile({
                        path: 'Checklist Veicular/' + filename,
                        data: base64Data,
                        directory: 'DOCUMENTS',
                        recursive: true
                    });
                    alert('PDF salvo em: Documentos/Checklist Veicular/' + filename);
                } catch (writeErr) {
                    console.error('Capacitor FS error:', writeErr);
                    alert('Erro ao salvar. Tentando download...');
                    await html2pdf().set(opt).from(htmlString).save();
                }
                return;
            }

            // ---- PC DESKTOP (File System Access API) ----
            if (window.showDirectoryPicker) {
                // Try to get previously saved folder
                let dirHandle = await getSavedDirHandle();

                if (!dirHandle) {
                    alert('Primeiro uso! Selecione onde deseja salvar os relatórios.\nA pasta "Checklist Veicular" será criada automaticamente dentro do local escolhido.');
                    dirHandle = await pickFolder();
                    if (!dirHandle) {
                        // User cancelled - do nothing, don't download
                        alert('Nenhuma pasta selecionada. O relatório NÃO foi salvo.');
                        return;
                    }
                }

                // Generate PDF as blob
                const pdfBlob = await html2pdf().set(opt).from(htmlString).output('blob');

                try {
                    await saveToFolder(dirHandle, filename, pdfBlob);
                    alert('PDF salvo com sucesso na pasta Checklist Veicular!\nArquivo: ' + filename);
                } catch (e) {
                    console.error('FS write failed, re-prompting folder:', e);
                    // Permission might have expired, ask again
                    dirHandle = await pickFolder();
                    if (dirHandle) {
                        await saveToFolder(dirHandle, filename, pdfBlob);
                        alert('PDF salvo com sucesso na pasta Checklist Veicular!\nArquivo: ' + filename);
                    } else {
                        alert('Não foi possível salvar. Nenhuma pasta selecionada.');
                    }
                }
                return;
            }

            // ---- FALLBACK (browsers that don't support File System Access) ----
            await html2pdf().set(opt).from(htmlString).save();

        } catch (err) {
            console.error('Erro ao gerar PDF:', err);
            alert('Erro ao gerar o PDF: ' + err.message);
        } finally {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    }
});
