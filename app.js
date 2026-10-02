// bio-tools Main Lobby JavaScript (大廳三)
document.addEventListener('DOMContentLoaded', () => {
  const selectTool = document.getElementById('selectTool');
  const btnGenerateQR = document.getElementById('btnGenerateQR');
  const btnCopyUrl = document.getElementById('btnCopyUrl');
  const qrResultArea = document.getElementById('qrResultArea');
  const qrcodeContainer = document.getElementById('qrcode');
  const generatedUrlInput = document.getElementById('generatedUrlInput');
  const btnDirectLaunch = document.getElementById('btnDirectLaunch');

  let qrInstance = null;

  function getTargetUrl() {
    const relativePath = selectTool.value;
    const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
    return baseUrl + relativePath;
  }

  btnGenerateQR.addEventListener('click', () => {
    const fullUrl = getTargetUrl();
    qrResultArea.classList.remove('hidden');
    generatedUrlInput.value = fullUrl;
    btnDirectLaunch.href = fullUrl;

    qrcodeContainer.innerHTML = '';
    qrInstance = new QRCode(qrcodeContainer, {
      text: fullUrl,
      width: 180,
      height: 180,
      colorDark: '#0f172a',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  });

  btnCopyUrl.addEventListener('click', () => {
    const fullUrl = getTargetUrl();
    navigator.clipboard.writeText(fullUrl).then(() => {
      alert('✅ 派發網址已成功複製到剪貼簿！');
    }).catch(() => {
      alert('複製失敗，請手動選取複製：\n' + fullUrl);
    });
  });
});
