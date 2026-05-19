// ==UserScript==
// @name         SECOM_HR_薪資查看時間停止倒數
// @namespace    https://github.com/formula2028/secom_stoptime_hr
// @version      1.2.2
// @description  修正查看薪資時60秒倒數會自動跳轉問題
// @author       formula2028
// @license      MIT
// @match        https://hr.aiontech.com.tw/servlet/jform?file=hrm8w.pkg,hrm8w_mss.pkg,hrm8w_secom.pkg,hrm8w_test.pkg&locale=TW&init_func=A14.1.%E8%96%AA%E8%B3%87%E6%A2%9D%E6%9F%A5%E8%A9%A2
// @match        https://hr.aiontech.com.tw/servlet/jform?file=hrm8w.pkg,hrm8w_mss.pkg,hrm8w_secom.pkg,hrm8w_test.pkg&locale=TW&init_func=A14.3.%E7%8D%8E%E9%87%91%E6%A2%9D%E6%9F%A5%E8%A9%A2
// @grant        none
// @run-at       document-end
// @supportURL   https://github.com/formula2028/secom_stoptime_hr/issues
// @downloadURL https://update.greasyfork.org/scripts/578807/SECOM_HR_%E8%96%AA%E8%B3%87%E6%9F%A5%E7%9C%8B%E6%99%82%E9%96%93%E5%81%9C%E6%AD%A2%E5%80%92%E6%95%B8.user.js
// @updateURL https://update.greasyfork.org/scripts/578807/SECOM_HR_%E8%96%AA%E8%B3%87%E6%9F%A5%E7%9C%8B%E6%99%82%E9%96%93%E5%81%9C%E6%AD%A2%E5%80%92%E6%95%B8.meta.js
// ==/UserScript==

(function() {
    'use strict';

    const MAX_TIME = 99;
    const targetId = 'COUNT_DOWN';
    const triggerButtonId = 'QUERY-box-button';
    const delaySeconds = 5;

    // --- 狀態管理旗標 ---
    let currentlyFrozen = false; // 預設為未凍結

    // --- 核心破解邏輯 (執行無窮大凍結) ---
    function performFinalFreeze(sourceDescription) {
        console.log(`【核心破解】${sourceDescription}，執行無窮大凍結...`);

        // 1. 強制歸零/重設全域變數 t (永不觸發 t==0)
        if (typeof window.t !== 'undefined') {
            window.t = MAX_TIME;
        }

        // 2. 呼叫網頁原有的停止開關 (停止原有的定時器 s)
        if (typeof window.stopCount === 'function') {
            window.stopCount();
        }

        // 3. 視覺修正 (確認凍結狀態)
        const countDownEl = document.getElementById(targetId);
        if (countDownEl) {
            countDownEl.innerText = MAX_TIME + " (凍結)";
            countDownEl.style.color = "#1a73e8"; // 改成藍色確認永久凍結
        }

        // 4. 更新狀態旗標
        currentlyFrozen = true;
        console.log("【狀態變更】已變更為：已凍結。");
    }

    // --- 初始化執行 ---
    // 完全不干涉網頁正常載入和初始化。
    console.log(`【初始化】腳本已準備，已抓取 ID: ${targetId} 與按鈕: ${triggerButtonId}。不干涉載入。目前狀態：未凍結。`);

    // ========================================================
    // 實作：按鈕點擊的狀態轉移邏輯
    // ========================================================

    const queryButton = document.getElementById(triggerButtonId);

    if (queryButton) {
        queryButton.addEventListener('click', function(e) {

            // --- 分支判斷：目前是否處於凍結狀態 ---

            if (currentlyFrozen) {
                // 分支 A：【再次按下】且目前已凍結。執行：暫時解凍5秒。
                console.log(`【觸發】偵測到已凍結狀態下按下 '${triggerButtonId}'。執行暫時解凍 5 秒...`);

                // 1. 重要：立刻斷開監視器，停止反應式持續修復。
                stopObserver();

                // 2. 視覺上把倒數文字改為紅色 (視覺確認解凍中)，不修改文字內容，
                // 讓網頁系統看到正常的倒數（或我們設的天文數字），從而允許 AJAX 執行。
                const countDownEl = document.getElementById(targetId);
                if (countDownEl) {
                    countDownEl.style.color = "#ea4335";
                    console.log("【視覺確認】倒數已變紅，系統應已允許重新查詢。等待 5 秒重新凍結。");
                }

                // 3. 更新狀態為未凍結
                currentlyFrozen = false;
                console.log("【狀態變更】已暫時變更為：未凍結。");

                // --- 開啟 5 秒延遲定時器 (重新凍結) ---
                setTimeout(function() {
                    // A. 延遲時間到，再次執行永久凍結
                    performFinalFreeze("再次點擊後 5 秒重新凍結");

                    // B. 重新啟動監視器
                    startObserver();
                }, delaySeconds * 1000);

            } else {
                // 分支 B：【第一次按下】或目前未凍結。執行：等待 5 秒凍結。
                console.log(`【觸發】偵測到未凍結狀態下按下 '${triggerButtonId}'。開始 5 秒凍結延遲。`);

                // 視覺確認
                const countDownEl = document.getElementById(targetId);
                if (countDownEl) {
                     countDownEl.style.color = "#ea4335";
                     console.log("【視覺確認】倒數已變紅，等待 5 秒延遲。");
                }

                // --- 開啟 5 秒延遲定時器 ---
                setTimeout(function() {
                    // A. 延遲時間到，執行永久凍結
                    performFinalFreeze("初始點擊後 5 秒延遲時間到期");

                    // B. 第一次啟動監視器
                    startObserver();
                }, delaySeconds * 1000);
            }

        }, { capture: true }); // 使用 capture 階段確保優先於網頁自身邏輯
    } else {
        console.warn(`【警告】找不到 ID 為 '${triggerButtonId}' 的按鈕，延遲功能無法啟動。`);
    }

    // ========================================================
    // 實作：MutationObserver 監視器函式化
    // ========================================================

    const callback = function(mutationsList, observer) {
        for(let mutation of mutationsList) {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                // 監視器偵測到變動 (且目前是凍結狀態時才會啟動它)，即時把它壓回去。
                performFinalFreeze("偵測到網頁更新 (反應式修復)");
            }
        }
    };

    const observer = new MutationObserver(callback);
    const targetNode = document.getElementById(targetId);
    const config = { childList: true, subtree: true, characterData: true };

    // 啟動監視器
    function startObserver() {
        if (targetNode) {
            observer.observe(targetNode, config);
            console.log("【監視器狀態】策略二監視器已貼附並啟動。");
        } else {
            console.error(`【錯誤】找不到 ID 為 ${targetId} 的元素，監視器無法啟動。`);
        }
    }

    // 停止監視器 (重要，解凍時呼叫)
    function stopObserver() {
        if (observer) {
            observer.disconnect();
            console.log("【監視器狀態】監視器已停止。");
        }
    }

})();