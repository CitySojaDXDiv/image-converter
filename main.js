// ========================================
// グローバル変数
// ========================================
let selectedFiles = [];
let processedBlobs = [];
let isCancelled = false;
let currentSize = 1280;

// ========================================
// DOM要素
// ========================================
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectBtn');
const fileCount = document.getElementById('fileCount');
const totalSize = document.getElementById('totalSize');
const processBtn = document.getElementById('processBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const cancelBtn = document.getElementById('cancelBtn');
const outputSection = document.getElementById('outputSection');
const summary = document.getElementById('summary');
const downloadBtn = document.getElementById('downloadBtn');
const errorList = document.getElementById('errorList');
const errorItems = document.getElementById('errorItems');
const resetBtn = document.getElementById('resetBtn');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const resizeOption = document.getElementById('resizeOption');
const resizeSettings = document.getElementById('resizeSettings');
const customSize = document.getElementById('customSize');
const previewSection = document.getElementById('previewSection');
const updatePreviewBtn = document.getElementById('updatePreviewBtn');

// ========================================
// 初期化
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ main.js読み込み完了');
    
    // イベントリスナーを先に設定
    setupEventListeners();
    
    // フォーマット対応チェック（非同期）
    checkFormatSupport();
});

// イベントリスナー設定
function setupEventListeners() {
    // ファイル選択
    selectBtn.addEventListener('click', () => {
        console.log('✅ selectBtnクリック');
        fileInput.click();
    });
    
    fileInput.addEventListener('change', handleFileSelect);
    
    // ドラッグ&ドロップ
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });
    
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });
    
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        handleFileSelect({ target: { files: e.dataTransfer.files } });
    });
    
    // リサイズオプション
    resizeOption.addEventListener('change', () => {
        resizeSettings.style.display = resizeOption.checked ? 'block' : 'none';
    });
    
    // プリセットボタン
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSize = parseInt(btn.dataset.size);
            customSize.value = '';
        });
    });
    
    // カスタムサイズ
    customSize.addEventListener('input', () => {
        if (customSize.value) {
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            currentSize = parseInt(customSize.value) || 1280;
        }
    });
    
    // 画質スライダー
    qualitySlider.addEventListener('input', () => {
        qualityValue.textContent = qualitySlider.value;
    });
    
    // プレビュー更新
    updatePreviewBtn.addEventListener('click', updatePreview);
    
    // 処理実行
    processBtn.addEventListener('click', processImages);
    
    // 中止
    cancelBtn.addEventListener('click', () => {
        isCancelled = true;
    });
    
    // ダウンロード
    downloadBtn.addEventListener('click', downloadZip);
    
    // リセット
    resetBtn.addEventListener('click', resetAll);
}

// ========================================
// フォーマット対応チェック
// ========================================
async function checkFormatSupport() {
    // WebP対応チェック
    const webpSupported = await checkImageFormatSupport('image/webp', 'UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA==');
    console.log('WebP対応:', webpSupported);
    
    if (!webpSupported) {
        const webpOption = document.getElementById('webpOption');
        if (webpOption) webpOption.style.display = 'none';
    }
    
    // AVIF対応チェック
    const avifSupported = await checkImageFormatSupport('image/avif', 'AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=');
    console.log('AVIF対応:', avifSupported);
    
    const avifOption = document.getElementById('avifOption');
    if (!avifOption) return;
    
    if (!avifSupported) {
        const span = avifOption.querySelector('span');
        span.textContent = 'AVIF（非対応）';
        span.title = 'このブラウザはAVIFに対応していません';
        avifOption.style.opacity = '0.5';
        
        const input = avifOption.querySelector('input');
        input.addEventListener('change', () => {
            if (input.checked) {
                alert('⚠️ このブラウザはAVIFに対応していません。\n\nChrome 85以降、Edge 121以降、Firefox 93以降を使用してください。');
            }
        });
    }
    
    // heic2any.js の読み込みチェック
    if (typeof heic2any === 'undefined') {
        console.warn('⚠️ heic2any.jsが読み込まれていません。HEICファイルは処理できません。');
    } else {
        console.log('✅ heic2any.js読み込み完了');
    }
}

// 画像フォーマット対応チェック
function checkImageFormatSupport(mimeType, base64Data) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = `data:${mimeType};base64,${base64Data}`;
    });
}

// ========================================
// ファイル選択処理（HEIC対応版）
// ========================================
function handleFileSelect(e) {
    console.log('✅ handleFileSelect呼び出し');
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    if (files.length > 50) {
        alert('⚠️ 1回の処理は最大50枚までです。ファイル数を減らしてください。');
        return;
    }
    
    // フォーマットチェック（HEIC追加）
    const validFiles = files.filter(f => {
        // HEIC/HEIFは拡張子でも判定
        const isHeic = f.name.toLowerCase().endsWith('.heic') || f.name.toLowerCase().endsWith('.heif');
        return f.type.match('image/(jpeg|jpg|png|webp|avif|bmp|heic|heif)') || isHeic;
    });
    
    if (validFiles.length !== files.length) {
        alert('⚠️ JPEG、PNG、WebP、AVIF、BMP、HEICのみ対応しています。');
    }
    
    // サイズチェック
    const totalBytes = validFiles.reduce((sum, f) => sum + f.size, 0);
    const totalMB = totalBytes / (1024 * 1024);
    
    if (totalMB > 300) {
        alert('⚠️ 合計サイズが300MBを超えています。ファイルを分けて処理してください。');
        return;
    }
    
    selectedFiles = validFiles;
    fileCount.textContent = validFiles.length;
    totalSize.textContent = totalMB.toFixed(2);
    processBtn.disabled = false;
    
    // プレビュー更新
    updatePreview();
}

// ========================================
// HEIC判定関数（新規追加）
// ========================================
function isHeicFile(file) {
    const fileName = file.name.toLowerCase();
    return fileName.endsWith('.heic') || fileName.endsWith('.heif') || 
           file.type === 'image/heic' || file.type === 'image/heif';
}

// ========================================
// HEICをBlobに変換（新規追加）
// ========================================
async function convertHeicToBlob(file) {
    if (typeof heic2any === 'undefined') {
        throw new Error('heic2any.jsが読み込まれていません');
    }
    
    try {
        // heic2anyでJPEGに変換
        const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9
        });
        
        // 配列で返される場合があるので最初の要素を取得
        return Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    } catch (error) {
        console.error('HEIC変換エラー:', error);
        throw new Error(`HEIC変換失敗: ${error.message}`);
    }
}

// ========================================
// フォーマット名を取得（HEIC追加）
// ========================================
function getFormatName(mimeTypeOrFile) {
    // Fileオブジェクトの場合
    if (mimeTypeOrFile instanceof File) {
        if (isHeicFile(mimeTypeOrFile)) {
            return 'HEIC';
        }
        mimeTypeOrFile = mimeTypeOrFile.type;
    }
    
    const formatMap = {
        'image/jpeg': 'JPEG',
        'image/jpg': 'JPEG',
        'image/png': 'PNG',
        'image/webp': 'WebP',
        'image/avif': 'AVIF',
        'image/bmp': 'BMP',
        'image/heic': 'HEIC',
        'image/heif': 'HEIC'
    };
    return formatMap[mimeTypeOrFile] || mimeTypeOrFile.split('/')[1].toUpperCase();
}

// ========================================
// プレビュー更新（HEIC対応版）
// ========================================
async function updatePreview() {
    if (selectedFiles.length === 0) return;
    
    updatePreviewBtn.disabled = true;
    updatePreviewBtn.textContent = '⏳ 計算中...';
    
    const format = document.querySelector('input[name="format"]:checked').value;
    const outputFormatName = getFormatName(format);
    const quality = parseFloat(qualitySlider.value);
    const shouldResize = resizeOption.checked;
    
    let totalBefore = 0;
    let totalAfter = 0;
    const previewData = [];
    
    for (const file of selectedFiles) {
        const beforeSize = file.size;
        totalBefore += beforeSize;
        
        try {
            const afterSize = await estimateFileSize(file, format, quality, shouldResize);
            totalAfter += afterSize;
            
            const reduction = ((beforeSize - afterSize) / beforeSize * 100).toFixed(1);
            
            previewData.push({
                name: file.name,
                originalFormat: getFormatName(file),
                outputFormat: outputFormatName,
                beforeSize: beforeSize,
                afterSize: afterSize,
                reduction: reduction
            });
        } catch (error) {
            console.error('プレビュー計算エラー:', file.name, error);
        }
    }
    
    // テーブル更新
    const previewTableBody = document.getElementById('previewTableBody');
    previewTableBody.innerHTML = previewData.map(item => `
        <tr>
            <td class="file-name" title="${item.name}">${item.name}</td>
            <td><span class="format-badge format-original">${item.originalFormat}</span></td>
            <td><span class="format-badge format-output">${item.outputFormat}</span></td>
            <td class="size-before">${formatBytes(item.beforeSize)}</td>
            <td class="size-after">${formatBytes(item.afterSize)}</td>
            <td class="reduction ${item.reduction < 0 ? 'negative' : ''}">${item.reduction}%</td>
        </tr>
    `).join('');
    
    // サマリー更新
    document.getElementById('beforeTotal').textContent = formatBytes(totalBefore);
    document.getElementById('afterTotal').textContent = formatBytes(totalAfter);
    const totalReduction = ((totalBefore - totalAfter) / totalBefore * 100).toFixed(1);
    document.getElementById('reductionRate').textContent = `${totalReduction}%`;
    
    previewSection.style.display = 'block';
    
    updatePreviewBtn.disabled = false;
    updatePreviewBtn.textContent = '🔄 プレビューを更新';
}

// ========================================
// ファイルサイズ推定（HEIC対応版）
// ========================================
async function estimateFileSize(file, format, quality, shouldResize) {
    // HEICの場合は先に変換
    let processFile = file;
    if (isHeicFile(file)) {
        try {
            processFile = await convertHeicToBlob(file);
        } catch (error) {
            console.error('HEIC事前変換エラー:', error);
            throw error;
        }
    }
    
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = (e) => {
            img.onload = () => {
                try {
                    let width = img.width;
                    let height = img.height;
                    
                    // リサイズ
                    if (shouldResize) {
                        const maxDim = Math.max(width, height);
                        if (maxDim > currentSize) {
                            const ratio = currentSize / maxDim;
                            width = Math.round(width * ratio);
                            height = Math.round(height * ratio);
                        }
                    }
                    
                    // Canvas描画
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Blob生成
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Blob生成失敗'));
                            return;
                        }
                        resolve(blob.size);
                    }, format, quality);
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error('画像読み込み失敗'));
            img.src = e.target.result;
        };
        
        reader.onerror = () => reject(new Error('ファイル読み込み失敗'));
        reader.readAsDataURL(processFile);
    });
}

// ========================================
// 画像処理メイン（HEIC対応版）
// ========================================
async function processImages() {
    if (selectedFiles.length === 0) return;
    
    processBtn.disabled = true;
    progressContainer.style.display = 'block';
    outputSection.style.display = 'none';
    isCancelled = false;
    processedBlobs = [];
    
    const format = document.querySelector('input[name="format"]:checked').value;
    const quality = parseFloat(qualitySlider.value);
    const shouldResize = resizeOption.checked;
    
    let successCount = 0;
    const errors = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
        if (isCancelled) {
            alert('❌ 処理を中止しました。');
            resetProgress();
            return;
        }
        
        const file = selectedFiles[i];
        progressText.textContent = `処理中: ${i + 1} / ${selectedFiles.length}`;
        progressFill.style.width = `${((i + 1) / selectedFiles.length) * 100}%`;
        
        try {
            const result = await convertImage(file, format, quality, shouldResize);
            processedBlobs.push(result);
            successCount++;
        } catch (error) {
            errors.push({ name: file.name, error: error.message });
        }
    }
    
    showResults(successCount, errors);
}

// ========================================
// 個別画像変換（HEIC対応版）
// ========================================
async function convertImage(file, format, quality, shouldResize) {
    // HEICの場合は先に変換
    let processFile = file;
    let originalName = file.name;
    
    if (isHeicFile(file)) {
        try {
            processFile = await convertHeicToBlob(file);
            console.log(`✅ HEIC変換成功: ${file.name}`);
        } catch (error) {
            console.error('HEIC変換エラー:', error);
            throw new Error(`HEIC変換失敗: ${error.message}`);
        }
    }
    
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = (e) => {
            img.onload = () => {
                try {
                    let width = img.width;
                    let height = img.height;
                    
                    // リサイズ
                    if (shouldResize) {
                        const maxDim = Math.max(width, height);
                        if (maxDim > currentSize) {
                            const ratio = currentSize / maxDim;
                            width = Math.round(width * ratio);
                            height = Math.round(height * ratio);
                        }
                    }
                    
                    // Canvas描画
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Blob生成
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Blob生成失敗'));
                            return;
                        }
                        
                        // ファイル名生成
                        const ext = format.split('/')[1];
                        const baseName = originalName.replace(/\.[^.]+$/, '');
                        const newName = `${baseName}.${ext}`;
                        
                        resolve({
                            blob: blob,
                            name: newName
                        });
                    }, format, quality);
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error('画像読み込み失敗'));
            img.src = e.target.result;
        };
        
        reader.onerror = () => reject(new Error('ファイル読み込み失敗'));
        reader.readAsDataURL(processFile);
    });
}

// ========================================
// 結果表示
// ========================================
function showResults(successCount, errors) {
    progressContainer.style.display = 'none';
    outputSection.style.display = 'block';
    
    const avgSize = processedBlobs.length > 0
        ? (processedBlobs.reduce((sum, b) => sum + b.blob.size, 0) / processedBlobs.length / 1024).toFixed(1)
        : 0;
    
    summary.innerHTML = `
        <p>✅ <strong>成功:</strong> ${successCount}枚</p>
        <p>❌ <strong>エラー:</strong> ${errors.length}枚</p>
        <p>📊 <strong>平均ファイルサイズ:</strong> 約${avgSize} KB</p>
    `;
    
    if (errors.length > 0) {
        errorList.style.display = 'block';
        errorItems.innerHTML = errors.map(e => `<li>${e.name}: ${e.error}</li>`).join('');
    }
    
    downloadBtn.disabled = processedBlobs.length === 0;
}

// ========================================
// ZIP生成＆ダウンロード
// ========================================
async function downloadZip() {
    if (processedBlobs.length === 0) return;
    
    downloadBtn.disabled = true;
    downloadBtn.textContent = '⏳ ZIP生成中...';
    
    try {
        const zip = new JSZip();
        
        processedBlobs.forEach(item => {
            zip.file(item.name, item.blob);
        });
        
        const blob = await zip.generateAsync({ type: 'blob' });
        
        // ファイル名生成
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 16).replace(/[-:T]/g, '').replace(/(\d{8})(\d{4})/, '$1_$2');
        const filename = `converted_${dateStr}.zip`;
        
        saveAs(blob, filename);
        
        downloadBtn.textContent = '✅ ダウンロード完了';
        setTimeout(() => {
            downloadBtn.textContent = '💾 ZIPをダウンロード';
            downloadBtn.disabled = false;
        }, 2000);
    } catch (error) {
        alert('❌ ZIP生成に失敗しました: ' + error.message);
        downloadBtn.textContent = '💾 ZIPをダウンロード';
        downloadBtn.disabled = false;
    }
}

// ========================================
// リセット
// ========================================
function resetAll() {
    selectedFiles = [];
    processedBlobs = [];
    fileInput.value = '';
    fileCount.textContent = '0';
    totalSize.textContent = '0';
    processBtn.disabled = true;
    outputSection.style.display = 'none';
    progressContainer.style.display = 'none';
    previewSection.style.display = 'none';
    errorList.style.display = 'none';
    progressFill.style.width = '0%';
}

function resetProgress() {
    progressContainer.style.display = 'none';
    processBtn.disabled = false;
}

// ========================================
// ユーティリティ関数
// ========================================
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}