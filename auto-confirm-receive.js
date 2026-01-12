auto.waitFor();
console.show();  // 建议保持打开，看一下日志方便判断哪里出问题

const BTN_X = device.width * 0.5;    // 屏幕中间
const BTN_Y = device.height * 0.90;  // 第 7 次点中的高度

function tapBottomButton(label) {
    console.log("点击底部【" + label + "】 坐标 = (" + BTN_X + ", " + BTN_Y + ")");
    click(BTN_X, BTN_Y);
}

// 只用控件自带的 click()，不再算 bounds，避免点到卡片本体
function tapConfirm(btn) {
    if (!btn) return false;
    console.log("直接 btn.click() 点击【确认收款】");
    return btn.click();
}

// ========= 一次完整的“收款流程”：收款 + 完成 =========
function doReceiveFlow() {
    // 先点【收款】
    tapBottomButton("收款");
    // 等弹窗切换到“完成”状态，时间放长一点，保险
    sleep(1500);

    // 再多点几次【完成】，防止网慢 / 动画慢 / 一次没点上
    console.log("开始连续点击【完成】");
    for (let i = 1; i <= 3; i++) {
        tapBottomButton("完成 第 " + i + " 次");
        sleep(800);
    }
}

// ========= 主循环 =========
while (true) {
    // 1⃣️ 先找当前页面所有可见 + 可点击的【确认收款】
    let confirmList = text("确认收款").clickable(true).visibleToUser(true).find();

    // 如果没找到，先尝试退回上一页再找一次，防止停在详情页/结果页就直接结束
    if (confirmList.empty()) {
        console.log("当前页面没有【确认收款】，尝试返回上一页");
        back();
        sleep(1500);

        confirmList = text("确认收款").clickable(true).visibleToUser(true).find();
        if (confirmList.empty()) {
            console.log("返回后仍然没有【确认收款】，脚本结束");
            break;
        }
    }

    console.log("本轮找到 " + confirmList.length + " 个【确认收款】");

    // 拷贝一份数组，避免遍历中 UI 改变导致节点失效
    let arr = [];
    confirmList.forEach(v => arr.push(v));

    for (let i = 0; i < arr.length; i++) {
        let btn = arr[i];
        if (!btn) continue;

        // 跳过最顶上的“未结算”那张卡片
        try {
            let b = btn.bounds();
            let centerY = b.centerY();
            // 比如小于屏幕高度 60% 的，认为是“顶部那张”，直接跳过
            if (centerY < device.height * 0.60) {
                console.log("第 " + (i + 1) + " 个【确认收款】太靠上（可能未结算卡片），跳过");
                continue;
            }
        } catch (e) {
            console.log("获取按钮位置失败，先不跳过，继续正常处理：" + e);
        }

        console.log("▶ 开始处理第 " + (i + 1) + " 个【确认收款】");

        // 2⃣️ 点击卡片右下角的【确认收款】
        if (!tapConfirm(btn)) {
            console.log("❌ click() 点击【确认收款】失败，跳过这个卡片");
            continue;
        }

        // 等半弹窗弹出来
        sleep(1500);

        // 3⃣️ 执行一整套【收款 -> 完成】流程（固定坐标，多次点击）
        doReceiveFlow();

        // 给页面一点时间刷新 / 返回列表
        sleep(1500);
    }

    // 一轮所有当前可见卡片处理完，稍微等一下再进行下一轮
    sleep(800);
}
