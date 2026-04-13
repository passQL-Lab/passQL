/**
 * 질문 관리 페이지 - JSON 내보내기/가져오기 + Sandbox 일괄 검증.
 * questions.html 에서 사용.
 */

// ── 체크박스 관리 ─────────────────────────────────────────────

function toggleSelectAll(master) {
    document.querySelectorAll('.question-checkbox').forEach(cb => {
        cb.checked = master.checked;
    });
    updateExportButtonState();
}

function onCheckboxChange() {
    const all = document.querySelectorAll('.question-checkbox');
    const checked = document.querySelectorAll('.question-checkbox:checked');
    const master = document.getElementById('selectAllCheckbox');
    if (master) {
        master.checked = all.length > 0 && all.length === checked.length;
        master.indeterminate = checked.length > 0 && checked.length < all.length;
    }
    updateExportButtonState();
}

function getSelectedUuids() {
    return Array.from(document.querySelectorAll('.question-checkbox:checked'))
        .map(cb => cb.dataset.uuid);
}

function updateExportButtonState() {
    const count = getSelectedUuids().length;

    // 선택 내보내기 버튼 상태
    const exportBtn = document.getElementById('exportSelectedBtn');
    const exportLabel = document.getElementById('exportSelectedLabel');
    if (exportBtn && exportLabel) {
        exportBtn.disabled = count === 0;
        exportLabel.textContent = count > 0 ? `선택 내보내기 (${count})` : '선택 내보내기';
    }

    // 선택 삭제 버튼 상태
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    const deleteLabel = document.getElementById('deleteSelectedLabel');
    if (deleteBtn && deleteLabel) {
        deleteBtn.disabled = count === 0;
        deleteLabel.textContent = count > 0 ? `선택 삭제 (${count})` : '선택 삭제';
    }

    // 선택 색인 버튼 상태
    const indexBtn = document.getElementById('indexSelectedBtn');
    const indexLabel = document.getElementById('indexSelectedLabel');
    if (indexBtn && indexLabel) {
        indexBtn.disabled = count === 0;
        indexLabel.textContent = count > 0 ? `선택 색인 (${count})` : '선택 색인';
    }
}

// ── 선택 색인 ─────────────────────────────────────────────────

/**
 * 선택된 문제들을 Qdrant에 재색인한다.
 * POST /admin/embeddings/index-selected JSON API 호출.
 */
async function indexSelected() {
    const uuids = getSelectedUuids();
    if (uuids.length === 0) {
        alert('색인할 문제를 선택해주세요.');
        return;
    }

    const btn = document.getElementById('indexSelectedBtn');
    const label = document.getElementById('indexSelectedLabel');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading loading-spinner loading-xs"></span> 색인 중...';
    }

    try {
        const resp = await fetch('/admin/embeddings/index-selected', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({uuids})
        });
        const data = await resp.json();
        if (data.error) {
            alert('색인 오류: ' + data.error);
        } else {
            alert(`색인 완료: ${data.succeeded}개 성공, ${data.failed}개 실패`);
        }
    } catch (e) {
        alert('색인 요청 실패: ' + e.message);
    } finally {
        if (btn && label) {
            btn.disabled = false;
            updateExportButtonState(); // 라벨 복구
            lucide.createIcons();
        }
    }
}

// ── 선택 일괄삭제 ─────────────────────────────────────────────

/**
 * 선택된 문제들을 일괄삭제한다.
 * 확인 모달을 먼저 열고, 사용자가 확정하면 API 호출 후 페이지를 새로고침한다.
 */
function deleteSelected() {
    const uuids = getSelectedUuids();
    if (uuids.length === 0) {
        alert('삭제할 문제를 선택해주세요.');
        return;
    }
    // 확인 모달에 선택 개수를 표시하고 열기
    const countEl = document.getElementById('bulkDeleteCount');
    if (countEl) countEl.textContent = uuids.length;
    document.getElementById('bulkDeleteModal').showModal();
}

/**
 * 일괄삭제 확인 후 실제 API를 호출한다.
 */
async function confirmBulkDelete() {
    const uuids = getSelectedUuids();
    if (uuids.length === 0) return;

    // 모달 버튼 로딩 상태
    const confirmBtn = document.getElementById('bulkDeleteConfirmBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="loading loading-spinner loading-xs"></span> 삭제 중...';
    }

    try {
        const resp = await fetch('/admin/questions/bulk', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questionUuids: uuids })
        });

        // ok 체크를 json 파싱 전에 수행 — 에러 응답이 HTML일 때 파싱 오류 방지
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            alert(err.message || '일괄삭제 실패');
            if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = '삭제'; }
            return;
        }

        const result = await resp.json();
        document.getElementById('bulkDeleteModal').close();

        // 결과 알림 후 새로고침
        const msg = `삭제 완료: ${result.deleted}건 삭제, ${result.skipped}건 스킵`;
        alert(msg);
        location.reload();
    } catch (e) {
        alert('삭제 오류: ' + e.message);
        document.getElementById('bulkDeleteModal').close();
        // 네트워크 오류 등 예외 시 버튼 상태 복구
        if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = '삭제'; }
    }
}

// ── 내보내기 ──────────────────────────────────────────────────

async function exportByFilter() {
    const params = new URLSearchParams(window.location.search);
    params.delete('page');
    params.delete('size');
    try {
        const resp = await fetch('/admin/questions/export?' + params.toString());
        if (!resp.ok) {
            const err = await resp.json();
            alert(err.message || '내보내기 실패');
            return;
        }
        await downloadJsonBlob(resp);
    } catch (e) {
        alert('내보내기 오류: ' + e.message);
    }
}

async function exportSelected() {
    const uuids = getSelectedUuids();
    if (uuids.length === 0) {
        alert('문제를 선택해주세요.');
        return;
    }
    try {
        const resp = await fetch('/admin/questions/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questionUuids: uuids })
        });
        if (!resp.ok) {
            const err = await resp.json();
            alert(err.message || '내보내기 실패');
            return;
        }
        await downloadJsonBlob(resp);
    } catch (e) {
        alert('내보내기 오류: ' + e.message);
    }
}

async function downloadJsonBlob(response) {
    const disposition = response.headers.get('Content-Disposition');
    let filename = 'passql-questions.json';
    if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ── 가져오기 ──────────────────────────────────────────────────

let _importValidationResult = null;
let _importOriginalItems = null;

function openImportFileDialog() {
    document.getElementById('importFileInput').click();
}

// ── JSON 붙여넣기 ────────────────────────────────────────────────

/**
 * JSON 붙여넣기 모달을 열고 textarea를 초기화한다.
 */
function openBulkPasteModal() {
    const area = document.getElementById('bulkPasteArea');
    const errEl = document.getElementById('bulkPasteError');
    if (area) area.value = '';
    if (errEl) { errEl.textContent = ''; errEl.classList.add('hidden'); }
    document.getElementById('bulkPasteModal').showModal();
}

/**
 * 붙여넣기 textarea의 내용을 파싱하여 기존 handleImportFile과 동일한
 * 검증 플로우(importValidationModal)로 연결한다.
 */
async function applyBulkFromPaste() {
    const area = document.getElementById('bulkPasteArea');
    const errEl = document.getElementById('bulkPasteError');

    const text = area ? area.value.trim() : '';
    if (!text) {
        showBulkPasteError('JSON을 입력해주세요.');
        return;
    }

    let items;
    try {
        items = JSON.parse(text);
    } catch (e) {
        showBulkPasteError('JSON 파싱 오류: ' + e.message);
        return;
    }

    if (!Array.isArray(items)) {
        showBulkPasteError('JSON은 배열 형태여야 합니다. 예: [{...}, {...}]');
        return;
    }

    if (items.length === 0) {
        showBulkPasteError('빈 배열입니다.');
        return;
    }

    if (items.length > 100) {
        showBulkPasteError('한 번에 최대 100건까지 가져올 수 있습니다. (현재: ' + items.length + '건)');
        return;
    }

    // 붙여넣기 모달을 닫고 검증 모달로 이동
    document.getElementById('bulkPasteModal').close();
    _importOriginalItems = items;

    const modal = document.getElementById('importValidationModal');
    const body = document.getElementById('importModalBody');
    const actions = document.getElementById('importModalActions');

    body.innerHTML = '<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span><span class="ml-3">Sandbox 검증 중... (' + items.length + '건)</span></div>';
    actions.innerHTML = '<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'importValidationModal\').close()">취소</button>';
    modal.showModal();

    try {
        const resp = await fetch('/admin/questions/import/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(items)
        });
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            body.innerHTML = '<div class="alert alert-error">' + escapeHtml(err.message || '검증 실패') + '</div>';
            return;
        }
        _importValidationResult = await resp.json();
        renderValidationModal(_importValidationResult);
    } catch (e) {
        body.innerHTML = '<div class="alert alert-error">검증 요청 오류: ' + escapeHtml(e.message) + '</div>';
    }
}

/**
 * 붙여넣기 모달의 에러 메시지를 표시한다.
 */
function showBulkPasteError(msg) {
    const errEl = document.getElementById('bulkPasteError');
    if (errEl) {
        errEl.textContent = msg;
        errEl.classList.remove('hidden');
    }
}

async function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';

    let items;
    try {
        const text = await file.text();
        items = JSON.parse(text);
    } catch (e) {
        alert('JSON 파싱 오류: ' + e.message);
        return;
    }

    if (!Array.isArray(items)) {
        alert('JSON 파일은 배열 형태여야 합니다.');
        return;
    }

    if (items.length === 0) {
        alert('빈 배열입니다.');
        return;
    }

    if (items.length > 100) {
        alert('한 번에 최대 100건까지 가져올 수 있습니다. (현재: ' + items.length + '건)');
        return;
    }

    _importOriginalItems = items;

    // 검증 요청
    const modal = document.getElementById('importValidationModal');
    const body = document.getElementById('importModalBody');
    const actions = document.getElementById('importModalActions');

    body.innerHTML = '<div class="flex justify-center py-12"><span class="loading loading-spinner loading-lg"></span><span class="ml-3">Sandbox 검증 중... (' + items.length + '건)</span></div>';
    actions.innerHTML = '<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'importValidationModal\').close()">취소</button>';
    modal.showModal();

    try {
        const resp = await fetch('/admin/questions/import/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(items)
        });
        if (!resp.ok) {
            const err = await resp.json();
            body.innerHTML = '<div class="alert alert-error">' + escapeHtml(err.message || '검증 실패') + '</div>';
            return;
        }
        _importValidationResult = await resp.json();
        renderValidationModal(_importValidationResult);
    } catch (e) {
        body.innerHTML = '<div class="alert alert-error">검증 요청 오류: ' + escapeHtml(e.message) + '</div>';
    }
}

function renderValidationModal(result) {
    const body = document.getElementById('importModalBody');
    const actions = document.getElementById('importModalActions');

    // 요약
    let html = '<div class="flex gap-4 mb-4 flex-wrap">';
    html += '<div class="stat bg-base-200 rounded-lg p-3"><div class="stat-title text-xs">전체</div><div class="stat-value text-lg">' + result.total + '</div></div>';
    html += '<div class="stat bg-success/10 rounded-lg p-3"><div class="stat-title text-xs">성공</div><div class="stat-value text-lg text-success">' + result.success + '</div></div>';
    html += '<div class="stat bg-error/10 rounded-lg p-3"><div class="stat-title text-xs">실패</div><div class="stat-value text-lg text-error">' + result.failed + '</div></div>';
    html += '<div class="stat bg-info/10 rounded-lg p-3"><div class="stat-title text-xs">신규</div><div class="stat-value text-lg text-info">' + result.newCount + '</div></div>';
    html += '<div class="stat bg-warning/10 rounded-lg p-3"><div class="stat-title text-xs">수정</div><div class="stat-value text-lg text-warning">' + result.updateCount + '</div></div>';
    html += '</div>';

    // 테이블
    html += '<div class="overflow-x-auto max-h-[50vh]"><table class="table table-xs table-pin-rows">';
    html += '<thead><tr><th>#</th><th>지문</th><th>토픽</th><th>난이도</th><th>Sandbox</th><th>상태</th></tr></thead><tbody>';

    for (const item of result.items) {
        const sandboxBadge = item.sandboxStatus === 'OK'
            ? '<span class="badge badge-success badge-sm">OK (' + (item.sandboxRowCount || 0) + '행, ' + (item.sandboxElapsedMs || 0) + 'ms)</span>'
            : item.sandboxStatus === 'SKIP'
                ? '<span class="badge badge-ghost badge-sm">SKIP</span>'
                : '<span class="badge badge-error badge-sm">FAIL</span>';

        const actionBadge = item.importAction === 'NEW'
            ? '<span class="badge badge-info badge-sm">신규</span>'
            : '<span class="badge badge-warning badge-sm">수정</span>';

        html += '<tr' + (item.sandboxStatus === 'FAIL' ? ' class="bg-error/5"' : '') + '>';
        html += '<td>' + (item.index + 1) + '</td>';
        html += '<td class="max-w-xs truncate text-xs">' + escapeHtml(item.stemPreview || '') + '</td>';
        html += '<td><span class="badge badge-outline badge-xs">' + escapeHtml(item.topicCode || '-') + '</span></td>';
        html += '<td>Lv.' + (item.difficulty || '-') + '</td>';
        html += '<td>' + sandboxBadge + '</td>';
        html += '<td>' + actionBadge + '</td>';
        html += '</tr>';

        // 실패 시 에러 메시지 표시
        if (item.sandboxStatus === 'FAIL' && item.sandboxError) {
            html += '<tr class="bg-error/5"><td></td><td colspan="5" class="text-xs text-error">' + escapeHtml(item.sandboxError) + '</td></tr>';
        }
    }

    html += '</tbody></table></div>';
    body.innerHTML = html;

    // 액션 버튼
    let actionsHtml = '<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'importValidationModal\').close()">취소</button>';
    if (result.success > 0) {
        actionsHtml += '<button class="btn btn-outline btn-sm" onclick="executeImport(\'SUCCESS_ONLY\')">성공한 것만 등록 (' + result.success + '건)</button>';
    }
    actionsHtml += '<button class="btn btn-primary btn-sm" onclick="executeImport(\'ALL\')">전체 등록 (' + result.total + '건)</button>';
    actions.innerHTML = actionsHtml;
}

async function executeImport(mode) {
    if (!_importOriginalItems) return;

    const actions = document.getElementById('importModalActions');
    actions.innerHTML = '<span class="loading loading-spinner loading-sm"></span> 등록 중...';

    // 검증 결과의 sandboxStatus 목록을 함께 전송 (서버에서 Sandbox 재실행 방지)
    const sandboxStatuses = _importValidationResult
        ? _importValidationResult.items.map(item => item.sandboxStatus)
        : null;

    try {
        const resp = await fetch('/admin/questions/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: _importOriginalItems, importMode: mode, sandboxStatuses })
        });
        if (!resp.ok) {
            const err = await resp.json();
            alert(err.message || '등록 실패');
            actions.innerHTML = '<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'importValidationModal\').close()">닫기</button>';
            return;
        }
        const result = await resp.json();
        alert('등록 완료: 신규 ' + result.created + '건, 수정 ' + result.updated + '건, 스킵 ' + result.skipped + '건');
        document.getElementById('importValidationModal').close();
        location.reload();
    } catch (e) {
        alert('등록 오류: ' + e.message);
        actions.innerHTML = '<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'importValidationModal\').close()">닫기</button>';
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
