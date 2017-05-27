/************************************************************
 * 20170527
 * GuaHsu(guaswork@gmail.com)
 * https://github.com/guahsu/Javascript-ETH-Listener
 ************************************************************/

/**
 * 使用者資料設定
 * @param {string} type 設定類別
 * 若type傳入為'start'代表剛進入這頁面，若localStorage有值則取用
 * 若否則代表使用者點擊設定按鈕，取用各欄位當前值並存入localStorage
 */
let userData = {};
function setUserData(type) {
    if (type === 'start' && localStorage.getItem('userData')) {
        userData = JSON.parse(localStorage.getItem('userData'));
        Object.keys(userData).forEach(key => {
            if (key === 'pushYn') {
                document.querySelector(`.${key}`).checked = userData[key];
            }
            document.querySelector(`.${key}`).value = userData[key];
        });
    } else {
        userData = {
            unitPrice: document.querySelector('.unitPrice').value || 0,
            buyQty: document.querySelector('.buyQty').value || 0,
            pushYn: document.querySelector('.pushYn').checked,
            priceType: document.querySelector('.priceType').value,
            comparison: document.querySelector('.comparison').value,
            setPrice: document.querySelector('.setPrice').value || 0,
        };
        localStorage.setItem('userData', JSON.stringify(userData));
    }
    getPrice(userData);
}

/**
 * 取得目前價格及顯示
 * @param {*} userData 使用者資料
 * AJAX取即時價格回來，並塞入陣列物件中
 */
function getPrice(userData) {
    const xhr = new XMLHttpRequest();
    xhr.open('get', 'https://exwd.csie.org/eth/eth-realtime', true);
    xhr.send();
    xhr.onload = function () {
        const res = JSON.parse(xhr.responseText);
        const priceDatas = [
            { className: 'title', price: priceFormat(res.raw_price), priceColor: 'N' },
            { className: '.nowPrice', price: priceFormat(res.raw_price), priceColor: 'N' },
            { className: '.buyPrice', price: priceFormat(res.raw_buy_price), priceColor: 'N' },
            { className: '.salePrice', price: priceFormat(res.raw_sell_price), priceColor: 'N' },
            { className: '.one', price: priceFormat(res.raw_sell_price) - userData.unitPrice, priceColor: 'Y' },
            { className: '.all', price: (priceFormat(res.raw_sell_price) - userData.unitPrice) * userData.buyQty, priceColor: 'Y' }
        ];
        //若有設定通知，且符合條件則發送通知
        if (userData.pushYn === true) {
            if (eval(`priceFormat(res.${userData.priceType}) ${userData.comparison} ${userData.setPrice}`)) {
                pushPrice(`${userData.priceType} ${userData.comparison} ${userData.setPrice}`);
            }
        }
        //顯示取得的資訊
        showPrice(priceDatas);
    };
}

/**
 * 格式化價錢
 * @param {*} rawPrice 
 * 將123456789格式化為1234.56789回傳
 */
function priceFormat(rawPrice) {
    return Number(rawPrice.toString().slice(0, 4) + '.' + rawPrice.toString().slice(4, 9));
}

/**
 * 顯示資訊
 * @param {*} priceDatas AJAX取回組成的資料
 * 迴圈將資料塞進html tag中，並顯示對應的正負顏色class
 */
function showPrice(priceDatas) {
    priceDatas.forEach(data => {
        data.price = data.price || 0;
        if (data.priceColor === 'Y' && data.price < 0) {
            document.querySelector(data.className).classList.add('box-data--minus');
            document.querySelector(data.className).classList.remove('box-data--plus');
        } else if ((data.priceColor === 'Y' && data.price > 0)) {
            document.querySelector(data.className).classList.add('box-data--plus');
            document.querySelector(data.className).classList.remove('box-data--minus');
        }
        document.querySelector(data.className).textContent = data.price.toFixed(2);
    });
}

/**
 * 發送通知
 * @param {*} msg 通知文字
 * 使用push.js
 */
function pushPrice(msg) {
    Push.create('到價通知', {
        body: `設定條件已達：[${msg}]`,
        timeout: 5000,
        icon: 'img/icon.png',
        onClick: function () {
            console.log("Fired!");
            window.focus();
            this.close();
        },
        vibrate: [200, 100, 200, 100, 200, 100, 200]
    });
}

//偵測設定按鈕 
const button = document.querySelector('.button');
button.addEventListener('click', setUserData);

//1分鐘取一次價錢資訊
setInterval(getPrice, 60000);

//開始
setUserData('start');

