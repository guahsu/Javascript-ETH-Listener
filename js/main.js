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
    } else {
        userData = {
            unitPrice: Number(document.querySelector('.unitPrice').value) || 0,
            buyQty: Number(document.querySelector('.buyQty').value) || 0,
            pushYn: document.querySelector('.pushYn').checked,
            priceType: document.querySelector('.priceType').value,
            comparison: document.querySelector('.comparison').value,
            setPrice: Number(document.querySelector('.setPrice').value) || 0,
        };
        localStorage.setItem('userData', JSON.stringify(userData));
    }
    //更新輸入欄位資訊
    Object.keys(userData).forEach(key => {
        if (key === 'pushYn') {
            document.querySelector(`.${key}`).checked = userData[key];
        }
        document.querySelector(`.${key}`).value = userData[key];
    });
    //取得目前價格
    getPrice(userData);
}

/**
 * 取得目前價格
 * AJAX取即時價格回來，並塞入陣列物件中
 */
function getPrice() {
    const xhr = new XMLHttpRequest();
    xhr.open('get', 'https://exwd.csie.org/eth/eth-realtime', true);
    xhr.send();
    xhr.onload = function () {
        const res = JSON.parse(xhr.responseText);
        const priceDatas = [
            { className: '.nowPrice', price: priceFormat(res.raw_price), priceColor: 'N' },
            { className: '.buyPrice', price: priceFormat(res.raw_buy_price), priceColor: 'N' },
            { className: '.salePrice', price: priceFormat(res.raw_sell_price), priceColor: 'N' },
            { className: '.now-one', price: priceFormat(res.raw_price) - userData.unitPrice, priceColor: 'Y' },
            { className: '.now-all', price: (priceFormat(res.raw_price) - userData.unitPrice) * userData.buyQty, priceColor: 'Y' }
            { className: '.maicoin-one', price: priceFormat(res.raw_sell_price) - userData.unitPrice, priceColor: 'Y' },
            { className: '.maicoin-all', price: (priceFormat(res.raw_sell_price) - userData.unitPrice) * userData.buyQty, priceColor: 'Y' }
        ];
        //若有設定通知，且符合條件則發送通知
        if (userData.pushYn && checkPrice(priceDatas, userData)) {
            pushPrice(`現價：${priceDatas[0].price.toFixed(2)}\n買價：${priceDatas[1].price.toFixed(2)}\n賣價：${priceDatas[2].price.toFixed(2)}`);
        }

        showPrice(priceDatas);
    };
}

/**
 * 到價設定判斷
 * @param {*} priceDatas 取回的價格資訊
 * @param {*} userData 使用者設定資料
 */
function checkPrice(priceDatas, userData) {
    if (userData.priceType === '現價' && userData.comparison === '大於') {
        return priceDatas[0].price >= userData.setPrice;
    }
    if (userData.priceType === '現價' && userData.comparison === '小於') {
        return priceDatas[0].price <= userData.setPrice;
    }
    if (userData.priceType === '買價' && userData.comparison === '大於') {
        return priceDatas[1].price >= userData.setPrice;
    }
    if (userData.priceType === '買價' && userData.comparison === '小於') {
        return priceDatas[1].price <= userData.setPrice;
    }
    if (userData.priceType === '賣價' && userData.comparison === '大於') {
        return priceDatas[2].price >= userData.setPrice;
    }
    if (userData.priceType === '賣價' && userData.comparison === '小於') {
        return priceDatas[2].price <= userData.setPrice;
    }
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
 */
function showPrice(priceDatas) {
    priceDatas.forEach(data => {
        data.price = data.price || 0;
        //依據損益正負設定對應顏色
        if (data.priceColor === 'Y' && data.price < 0) {
            document.querySelector(data.className).classList.add('box-data--minus');
            document.querySelector(data.className).classList.remove('box-data--plus');
        } else if ((data.priceColor === 'Y' && data.price > 0)) {
            document.querySelector(data.className).classList.add('box-data--plus');
            document.querySelector(data.className).classList.remove('box-data--minus');
        }
        //依據資料顯示對應欄位內容
        document.querySelector(data.className).textContent = data.price.toFixed(2);
    });
    //將現價設定到網頁title
    document.title = `ETH：${priceDatas[0].price.toFixed(0)}`
}

/**
 * 發送通知
 * @param {*} msg 通知文字
 * 使用push.js
 */
function pushPrice(msg) {
    Push.create('到價通知', {
        body: msg,
        timeout: 6000,
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

