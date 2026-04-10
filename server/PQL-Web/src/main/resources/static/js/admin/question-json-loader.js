/**
 * 문제 등록/수정 폼의 JSON 불러오기 공통 로직.
 * question-register.html, question-edit.html 에서 공유.
 *
 * 사용법:
 *   initQuestionJsonLoader({ confirmOverwrite: false }); // 등록 폼
 *   initQuestionJsonLoader({ confirmOverwrite: true });   // 수정 폼 (덮어쓰기 확인)
 */

let _jsonLoaderConfig = { confirmOverwrite: false };

function initQuestionJsonLoader(config) {
    _jsonLoaderConfig = { ..._jsonLoaderConfig, ...config };
}

function applyJson(data) {
    // topicCode → select option 매핑 (등록 폼: id='topicSelect', 수정 폼: name='topicUuid')
    if (data.topicCode) {
        const sel = document.getElementById('topicSelect') || document.querySelector('select[name="topicUuid"]');
        if (sel) {
            for (const opt of sel.options) {
                if (opt.dataset.code === data.topicCode) {
                    sel.value = opt.value;
                    break;
                }
            }
        }
    }

    // 난이도
    if (data.difficulty != null) {
        const rangeEl = document.querySelector('input[name="difficulty"]');
        if (rangeEl) {
            rangeEl.value = data.difficulty;
            const label = document.getElementById('difficultyLabel');
            if (label) label.textContent = 'Lv.' + data.difficulty;
        }
    }

    // 실행 모드
    if (data.executionMode) {
        const radio = document.querySelector('input[name="executionMode"][value="' + data.executionMode + '"]');
        if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
        }
    }

    // 선택지 정책 — select(등록 폼) 또는 hidden input(AI 생성 폼) 모두 지원
    if (data.choiceSetPolicy) {
        const sel = document.getElementById('choiceSetPolicySelect');
        if (sel) {
            sel.value = data.choiceSetPolicy;
        }
        const hidden = document.getElementById('choiceSetPolicyHidden');
        if (hidden) {
            hidden.value = data.choiceSetPolicy;
        }
    }

    // 텍스트 필드
    const textMap = {
        stem: 'textarea[name="stem"]',
        hint: 'input[name="hint"]',
        schemaDdl: 'textarea[name="schemaDdl"], #schemaDdl',
        schemaSampleData: 'textarea[name="schemaSampleData"], #schemaSampleData',
        schemaDisplay: 'textarea[name="schemaDisplay"]',
        schemaIntent: 'input[name="schemaIntent"]',
        answerSql: 'textarea[name="answerSql"], #answerSql'
    };
    for (const [key, selector] of Object.entries(textMap)) {
        if (data[key] != null) {
            const el = document.querySelector(selector);
            if (el) el.value = data[key];
        }
    }
}

function _doApplyJson(data) {
    if (_jsonLoaderConfig.confirmOverwrite) {
        if (!confirm('현재 입력된 내용을 JSON 데이터로 덮어쓰시겠습니까?')) return;
    }
    applyJson(data);
}

function loadJsonFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            _doApplyJson(data);
        } catch (err) {
            alert('JSON 파싱 오류: ' + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function openJsonPasteModal() {
    document.getElementById('jsonPasteArea').value = '';
    document.getElementById('jsonPasteError').classList.add('hidden');
    document.getElementById('jsonPasteModal').showModal();
}

function applyJsonFromPaste() {
    const raw = document.getElementById('jsonPasteArea').value.trim();
    const errEl = document.getElementById('jsonPasteError');
    try {
        const data = JSON.parse(raw);
        _doApplyJson(data);
        document.getElementById('jsonPasteModal').close();
    } catch (err) {
        errEl.textContent = 'JSON 파싱 오류: ' + err.message;
        errEl.classList.remove('hidden');
    }
}
