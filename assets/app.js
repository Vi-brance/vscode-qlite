/**
 * 内置全局变量，封装了一些与宿主交互的方法
 * @type {import("./types").Webview}
 */
var webview;

/**
 * 群员列表
 * @type {Map<number, import("oicq").MemberInfo>}
 */
let memberInfoMap = new Map;

/**
 * 群资料
 * @type {import("oicq").GroupInfo}
 */
let groupInfo;

/**
 * 好友资料
 * @type {import("oicq").FriendInfo}
 */
let friendInfo;

/**
 * 发送状态
 */
let sending = false;

/**
 * 更新好友资料
 */
function updateFriendInfo() {
    webview.getSimpleInfo().then(value => { friendInfo = value; });
}

/**
 * 更新群和群友资料
 */
function updateGroupInfo() {
    webview.renew().then(value => { groupInfo = value; });
    webview.getMemberMap().then((memberMap) => {
        memberInfoMap = new Map;
        memberMap.forEach((member) => {
            memberInfoMap.set(member.user_id, member);
        });
    });
}

/**
 * XSS过滤
 * @param {string} str 要过滤的字符串
 * @returns {string} 过滤后的str
 */
function filterXss(str) {
    const xssMap = {
        "&": "&amp;",
        "\"": "&quot;",
        "<": "&lt;",
        ">": "&gt;",
        " ": "&nbsp;",
        "\t": "&emsp;",
    };
    str = str.replace(/[&"<>\t ]/g, (s) => {
        return xssMap[s];
    });
    str = str.replace(/\r\n/g, "<br>").replace(/\r/g, "<br>").replace(/\n/g, "<br>");
    return str;
}

/**
 * 生成昵称标签
 * @param {number} id 目标id
 * @returns {string} 加粗昵称元素
 */
function genLabel(id) {
    if (webview.c2c) {
        return `<b title="${id}">${filterXss(friend.nickname)}</b>`;
    } else {
        const member = memberInfoMap.get(id);
        let name = "";
        if (member) {
            name = filterXss(member.card ? member.card : member.nickname);
        }
        return `<b title="${id}">${name}</b>`;
    }
}

/**
 * 生成at元素
 * @param {string} qq at目标的qq或"all"
 * @returns {string} at的HTML
 */
function genAt(qq) {
    if (webview.c2c) {
        return "";
    }
    let label = "";
    if (qq === "all") {
        label = "全体成员";
    } else {
        const member = memberInfoMap.get(Number(qq));
        label = member ? filterXss(member.card ? member.card : member.nickname) : qq;
    }
    return `<a class="at" id="${qq}" href="javascript:void(0);">@${label}</a>`;
}

/**
 * 添加at元素到输入框
 * @param {string} qq at目标的qq或"all"
 */
function appendAt(qq) {
    document.querySelector(".input-content").insertAdjacentHTML("beforeend", genAt(qq));
}

/**
 * 构造表情元素
 * @param {number} id 表情序号
 * @param {boolean} addable true则点击表情会添加到输入框，false不会
 * @returns {string} 表情的HTML
 */
function genFace(id, addable = false) {
    return `<img class="face" src="${webview.faces_path + id}.png" id=${id} ${addable ? "onclick='appendFace(this)'" : ""}>`;
}

/**
 * 添加表情到输入框
 * @param {HTMLImageElement} face 表情元素
 */
function appendFace(face) {
    document.querySelector(".input-content").insertAdjacentHTML("beforeend", genFace(face.id));
}

/**
 * 构造图片元素
 * @param {string} src 图片url地址
 * @param {boolean} addable true则点击图片会添加到输入框，false不会
 * @returns {string} 图片的HTML
 */
function genImage(src, addable = false) {
    return `<img src="${src}" onload="drawImage(this)" ondblclick="enlargeImage(this)" ${addable ? "onclick='appendImage(this)'" : ""}>`;
}

/**
 * 添加图片到输入框
 * @param {HTMLImageElement} image 图片元素
 */
function appendImage(image) {
    document.querySelector(".input-content").insertAdjacentHTML("beforeend", genImage(image.src));
}

/**
 * 限制图片大小
 * @param {HTMLImageElement} img 图片元素
 */
function drawImage(img) {
    const limit = 400; // 长宽上限
    if (img.width > img.height) {
        img.style.maxWidth = `${limit}px`;
    } else {
        img.style.maxHeight = `${limit}px`;
    }
}

/**
 * 放大图片
 * @param {HTMLImageElement} img 图片元素
 */
function enlargeImage(img) {
    /** @type {HTMLDivElement} */
    const imgBox = document.querySelector(".large-img");
    imgBox.innerHTML = `<img src="${img.src}">`;
    imgBox.style.display = "flex";
}

/**
 * 加载转发消息
 * @param {HTMLElement} trigger 转发消息元素
 */
function triggerForwardMsg(trigger) {
    const forwardMsg = trigger.nextElementSibling;
    forwardMsg.style.display = forwardMsg.style.display === "none" ? "block" : "none";
    if (forwardMsg.innerHTML === "" || forwardMsg.innerHTML === "加载失败") {
        forwardMsg.innerHTML = "...";
        webview.getForwardMsg(trigger.id).then((msgList) => { // 尝试重新获取消息
            let html = "";
            msgList.forEach((msg) => {
                html += `<p>👤${filterXss(msg.nickname)}(${msg.user_id})} ${webview.datetime(msg.time)}</p>${parseMessage(msg.message)}`;
            });
            if (!html) {
                html = "加载失败";
            }
            forwardMsg.innerHTML = html;
        });
    }
}

/**
 * 生成消息元素
 * @param {import("oicq").MessageElem[]} msgList 消息元素列表
 * @returns {string} 消息的HTML
 */
function parseMessage(msgList) {
    let html = "";
    msgList.forEach(async (msg) => {
        switch (msg.type) {
            case "text": // 纯文本，替换链接
                html += filterXss(msg.text).replace(/(https?:\/\/[^\s]+)/g, "<a href='$1'>$1</a>");
                break;
            case "at": // @群友
                html += genAt(msg.qq);
                break;
            case "face": // QQ表情
            case "sface":
                html += msg.id > 324 ? `[${msg.text || "QQ表情"}]` : genFace(msg.id);
                break;
            case "bface": // 原创表情
                html += msg.text ? `[${filterXss(msg.text)}]` : "[原创表情]";
                break;
            case "image": // 图片
            case "flash": // 闪照
                if (!webview.c2c) {
                    msg.url = msg.url.replace(/\/[0-9]+\//, "/0/").replace(/[0-9]+-/g, "0-");
                }
                html += genImage(msg.url);
                break;
            case "record": // 语音
                // 语音消息不支援HTML播放, 因为HTML不支援 .amr / .silk 格式 
                html = `<a href="${msg.url}" target="_blank">[语音消息${msg.seconds ? `(${msg.seconds}s)` : ""}]</a>`;
                break;
            case "video": // 视频
                // TODO: 获取视频链接无法同步执行
                html = `<span onclick="javascript:var s=this.nextElementSibling.style;s.display=s.display==='none'?'block':'none';">[视频消息]</span>
                    <video height=200 style="display:none;" src="${await webview.getFileUrl(msg.fid)}" controls>`;
                break;
            case "xml":
                const dom = new DOMParser().parseFromString(msg.data, "text/xml");
                if (dom.querySelector("msg")?.getAttribute("serviceID") === "35") {
                    try {
                        const resid = /resid="[^"]+"/.exec(msg.data)[0].replace("resid=\"", "").replace("\"", "");
                        html = `<span onclick="triggerForwardMsg(this)" id="${resid}">[合并转发]</span>
                        <span class="msg-forward"></span>`;
                    } catch {
                        html = `<span onclick="javascript:var s=this.nextElementSibling.style;s.display=s.display==='none'?'block':'none';">[嵌套转发]</span>
                        <span style="display:none">${filterXss(msg.data)}</span>`;
                    }
                } else {
                    if (dom.querySelector("msg")?.getAttribute("action") === "web") { //判断是否为链接分享
                        const title = dom.querySelector("msg").getAttribute("brief");
                        const url = dom.querySelector("msg").getAttribute("url");
                        html = `<a href="${filterXss(url)}">${filterXss(title)}</a><br>` + filterXss(dom.querySelector("summary")?.innerHTML);
                    } else {
                        html = `<span onclick="javascript:var s=this.nextElementSibling.style;s.display=s.display==='none'?'block':'none';">[XML卡片消息]</span>
                        <span style="display:none">${filterXss(msg.data)}</span>`;
                    }
                }
                break;
            case "json":
                const jsonCardHandler = {
                    "com.tencent.mannounce": (data) => { // 群公告
                        const mannounce = data.meta.mannounce;
                        const title = decodeURIComponent(mannounce.title.toString("base64"));
                        const content = decodeURIComponent(mannounce.text.toString("base64"));
                        return `<span class="jsonMsgTitle">${filterXss(title)}</span>
                        <span class="jsonMsgContent">${filterXss(content)}</span>`;
                    },
                    "com.tencent.miniapp_01": (data) => { // APP小程序分享
                        const { desc: title, preview, qqdocurl: url, title: platform } = data.meta.detail_1;
                        const img = preview.startsWith('http') ? preview : `https://${preview}`;
                        return `<div class="miniapp" title="From ${platform}">
                            <a href="${url}" target="_blank">${title}</a>
                            <br>${genImage(img)}
                        </div>`;
                    },
                    "com.tencent.structmsg": (data) => {
                        const prompt = data.prompt;
                        const { title, preview, jumpUrl: url, tag: platform, desc } = data.meta.news;
                        const btn = `<span onclick="javascript:var s=this.nextElementSibling.style;s.display=s.display==='none'?'block':'none';">${prompt}[${platform}]</span>`;
                        const content = `<span style="display:none;">
                            <a href="${url}" target="_blank">${title}</a>${title === desc ? '' : `<h5>${desc}</h5>`}<br>
                            <a href="${preview}" target="_blank">[封面]</a>
                        </span>`;
                        return `${btn}${content}`;
                    }
                };
                try {
                    const jsonObj = JSON.parse(msg.data);
                    if (jsonCardHandler[jsonObj.app] instanceof Function) {
                        html = jsonCardHandler[jsonObj.app](jsonObj);
                    } else {
                        html = `<span onclick="javascript:var s=this.nextElementSibling.style;s.display=s.display==='none'?'block':'none';">[JSON卡片消息]</span>
                        <span style="display:none">${filterXss(JSON.stringify(jsonObj, null, 4))}</span>`;
                    }
                } catch { }
                break;
            case "file": // 文件
                // TODO: 获取文件链接无法同步执行
                html = `<a class="file" href="${await webview.getFileUrl(msg.fid)}" target="_blank">文件：${filterXss(msg.name)}(${msg.size / 1e6}MB)</a>`;
                break;
            case "rps": // 石头剪刀布
                const fingers = {
                    1: "石头",
                    2: "剪刀",
                    3: "布"
                };
                html += `[猜拳：${fingers[msg.id] ?? msg.id}]`;
                break;
            case "dice": // 骰骰子
                html += `[骰子：${msg.id}]`;
                break;
            case "shake": // 窗口抖动
                html = "[窗口抖动]";
                break;
            case "poke": // 戳一戳
                html = "[戳一戳]";
                break;
        }
    });
    return html;
}

/**
 * 生成带头像、昵称、时间戳和消息本体的完整消息
 * @param {ipmort("oicq").PrivateMessage | import("oicq").GroupMessage} msg 私聊/群聊消息
 * @returns 一条完整的消息的HTML
 */
function genUserMessage(msg) {
    // TODO: 重复消息判断只在chatbox的子元素中查找
    if (document.getElementById(msg.seq)) { // 重复消息
        return "";
    }
    // 获取头衔和昵称
    let title = "", name = "";
    if (msg.sub_type === "anonymous") {
        title = `<span class="htitle member">匿名</span>`;
        name = msg.anonymous.name;
    } else {
        if (msg.sender.role === "owner") {
            title = `<span class="htitle owner">群主</span>`;
        } else if (msg.sender.role === "admin") {
            title = `<span class="htitle admin">管理员</span>`;
        }
        name = filterXss(msg.sender.card ? msg.sender.card : msg.sender.nickname);
    }
    return `<div class="${msg.sender.user_id === webview.self_uin ? "cright" : "cleft"} cmsg", id="${msg.seq}", time="${msg.time}">
        <img class="headIcon radius" src="${webview.getUserAvatarUrlSmall(msg.sender.user_id)}">
        <span class="name" uid="${msg.sender.user_id}" title="${msg.sender.user_id} ${webview.datetime(msg.time)}">
            <span>${title}</span>
            <span ondblclick="appendAt(${msg.sender.user_id})">${webview.c2c ? "" : name}</span>
            <span>${webview.timestamp(msg.time)}</span>
        </span>
        <span class="content">${parseMessage(msg.message)}</span>
    </div>`;
}

/**
 * 生成聊天通知
 * @param {import("oicq").GroupNoticeEvent | import("oicq").PrivateMessageEvent} event 私聊/群聊通知
 * @returns 通知的HTML
 */
function genSystemMessage(event) {
    let msg = "";
    if (event.notice_type === "friend") { // 私聊通知
        switch (event.sub_type) {
            case "poke": // 戳一戳
                msg = `<span class="tips-info">${genLabel(event.operator_id)} ${event.action} ${webview.nickname} ${event.suffix}</span>`;
                break;
            case "recall": // 撤回（仅通知，消息不删除）
                msg = `<span class="tips-private">${genLabel(event.operator_id)} 撤回了 <a href="#${event.seq}" onclick="document.getElementById(${event.seq}).animate([{'background':'var(--vscode-sideBar-background)'}],{duration: 3000})">一条消息</a></span>`;
                break;
        }
    } else if (event.notice_type === "group") { // 群聊通知
        switch (event.sub_type) {
            case "recall": // 撤回（仅通知，消息不删除）
                msg = `<span class="tips-private">${genLabel(event.operator_id)} 撤回了 ${event.user_id === event.operator_id ? "自己" : genLabel(event.user_id)} 的<a href="#${event.seq}" onclick="document.getElementById(${event.seq}).animate([{'background':'var(--vscode-sideBar-background)'}],{duration: 3000})">一条消息</a></span>`;
                break;
            case "increase": // 群友加群
                updateMemberList();
                msg = `<span class="tips-success">${genLabel(event.user_id)} 加入了群聊</span>`;
                break;
            case "decrease": // 群友退群
                if (event.dismiss) { // 群解散
                    msg = `<span class="tips-danger">该群已被解散</span>`;
                    break;
                }
                if (event.operator_id === event.user_id) {
                    msg = `<span class="tips-warning">${genLabel(event.user_id)} 退出了群聊</span>`;
                } else {
                    msg = `<span class="tips-warning">${genLabel(event.operator_id)} 踢出了 ${genLabel(event.user_id)}</span>`;
                }
                updateMemberList();
                break;
            case "admin": // 管理员变更
                msg = `<span class="tips-info">${genLabel(event.user_id)} ${event.set ? "成为了" : "被取消了"}管理员</span>`;
                updateMemberList();
                break;
            case "transfer": // 群主转让
                msg = `<span class="tips-info">${genLabel(event.operator_id)} 将群主转让给了 ${genLabel(event.user_id)}</span>`;
                updateMemberList();
                break;
            case "ban": // 禁言
                if (event.user_id > 0) {
                    msg = `<span class="tips-danger">${genLabel(event.operator_id)} 禁言 ${event.user_id === 80000000 ? "匿名用户(" + event.nickname + ")" : genLabel(event.user_id)} ${~~(event.duration / 60)}分钟</span>`;
                } else {
                    msg = `<span class="tips-info">${genLabel(event.operator_id)} ${event.duration > 0 ? "开启" : "关闭"}了全员禁言</span>`;
                }
                updateMemberList();
                break;
            case "poke": // 戳一戳
                msg = `<span class="tips-info">${genLabel(event.operator_id)} ${event.action} ${genLabel(event.user_id)} ${event.suffix}</span>`;
                break;
        }
    }
    if (!msg) {
        return "";
    }
    return `<div class="tips" title="${webview.datetime(event.time)}">${msg}</div>`;
}

/**
 * 添加新消息元素到聊天窗口末尾
 * @param {string} msg HTML格式的消息
 */
function appendMessage(msg) {
    const chatbox = document.querySelector(".chat-box");
    chatbox.insertAdjacentHTML("beforeend", msg);
    if (chatbox.scrollHeight - chatbox.scrollTop < chatbox.clientHeight * 1.5) { // 浏览历史记录时收到新消息不滑动窗口
        chatbox.scroll(0, chatbox.scrollHeight);
    }
}

/**
 * 获取聊天记录
 * @param {number | undefined} seq 群聊为消息序号，默认从最后一条发言往前；私聊为时间，默认从当前时间往前
 * @param {number} count 获取的消息条数，默认为20条，最大20条
 */
function getChatHistory(seq, count = 20) {
    webview.getChatHistory(seq, count).then((msgList) => {
        let html = "", msgMark = [];
        msgList.forEach((msg) => {
            // 私聊以time为标识，群聊以seq为标识
            const mark = webview.c2c ? msg.time : msg.seq;
            if (!msgMark.includes(mark)) {
                msgMark.push(mark);
                html += genUserMessage(msg);
            }
        });
        if (!html) {
            return;
        }
        const chatbox = document.querySelector(".chat-box");
        chatbox.insertAdjacentHTML("afterbegin", html);
        if (seq) { // 上划获取历史记录，窗口停留在加载消息处
            window.location.hash = "#" + msgList[msgList.length - 1].seq;
        } else { // 初次加载历史记录，窗口滑动到底部
            chatbox.scroll(0, chatbox.scrollHeight);
        }
    });
}

/**
 * 发送消息
 */
function sendMessage() {
    /** @type {NodeListOf<ChildNode>} */
    const nodes = document.querySelector(".input-content").childNodes;
    if (sending || !nodes) { // 消息正在发送or输入框为空
        return;
    }
    sending = true;
    document.querySelector(".send").disabled = true; // 禁用发送按钮

    /** @type {(string | oicq.MessageElem)[]} */
    const messageList = [];
    nodes.forEach(value => {
        let segment;
        if (value.nodeName === "BR") { // 回车特判
            segment = {
                type: "text",
                text: "\n"
            };
        } else if (value.nodeName === "#text") { // 文字
            segment = {
                type: "text",
                text: value.textContent
            };
        } else if (value.nodeName === "IMG") { // 图片
            if (value.className === "face") { // qq表情
                segment = {
                    type: "face",
                    id: Number(value.id)
                };
            } else { // 图片
                const file = value.currentSrc.startsWith("https") ? value.currentSrc : value.currentSrc.split(";")[1].replace(",", "://");
                segment = {
                    type: "image",
                    file: file,
                    url: value.currentSrc
                };
            }
        } else if (value.nodeName === "A") { // at
            segment = {
                type: "at",
                qq: value.id === "all" ? value.id : Number(value.id)
            };
        } else { // 暂不支持的类型
            segment = "";
        }
        messageList.push(segment);
    });
    // 调用上层方法
    webview.sendMsg(messageList).then(value => {
        if (value.seq && webview.c2c) {
            document.querySelector(".chat-box").insertAdjacentHTML("beforeend", genUserMessage({
                message: messageList,
                sender: {
                    nickname: webview.nickname,
                    user_id: webview.self_uin,
                },
                seq: value.seq,
                time: value.time
            }));
        }
    }).finally(() => {
        sending = false;
        document.querySelector(".send").disabled = false;
        document.querySelector(".input-content").textContent = "";
        document.querySelector(".chat-box").scroll(0, document.querySelector(".chat-box").scrollHeight);
    });
}

// 主体框架
document.querySelector("body").insertAdjacentHTML("beforeend",
    `<div class="chat-box"></div>
    <div class="large-img" onclick="this.style.display='none';"></div>
    <div class="chat-tool stamp-box" style="display: none;"></div>
    <div class="chat-tool face-box" style="display: none;"></div>
    <div class="chat-tool at-box" style="display: none;"></div>
    <div class="chat-input">
        <hr class="boundary">
        <button class="tool-button show-stamp-box" type="button" title="漫游表情">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14.8802 4.78006C14.7995 4.46425 14.675 4.16128 14.5102 3.88003C14.3519 3.58746 14.1495 3.32097 13.9102 3.08999C13.5631 2.74413 13.1522 2.46909 12.7002 2.28006C11.7904 1.90665 10.77 1.90665 9.86018 2.28006C9.43294 2.4609 9.04045 2.71468 8.70021 3.03006L8.65022 3.08999L8.00019 3.74002L7.35017 3.08999L7.30018 3.03006C6.95993 2.71468 6.56744 2.4609 6.14021 2.28006C5.23036 1.90665 4.21002 1.90665 3.30018 2.28006C2.84816 2.46909 2.43725 2.74413 2.09022 3.08999C1.8507 3.32329 1.64532 3.58929 1.4802 3.88003C1.32277 4.16367 1.20179 4.46609 1.12019 4.78006C1.0354 5.10648 0.995044 5.44285 1.00019 5.78006C1.00071 6.09718 1.04102 6.41292 1.12019 6.72C1.20402 7.03004 1.32491 7.32888 1.4802 7.61001C1.64792 7.89902 1.85304 8.16468 2.09022 8.40005L8.00019 14.3101L13.9102 8.40005C14.1473 8.16709 14.3494 7.90095 14.5102 7.61001C14.6731 7.33138 14.7975 7.03199 14.8802 6.72C14.9594 6.41292 14.9997 6.09718 15.0002 5.78006C15.0053 5.44285 14.965 5.10648 14.8802 4.78006V4.78006ZM13.8802 6.41006C13.8214 6.63368 13.734 6.84881 13.6202 7.05008V7.05008C13.5014 7.25741 13.3569 7.44887 13.1902 7.62002L7.98017 12.82L2.77021 7.62002C2.60044 7.44904 2.45263 7.25762 2.33021 7.05008C2.21502 6.84476 2.12437 6.62656 2.06019 6.40005C2.00895 6.17357 1.98214 5.94219 1.9802 5.70999C1.98156 5.47115 2.00836 5.23318 2.06019 5.00003C2.12249 4.77287 2.21323 4.55445 2.33021 4.35C2.45016 4.1408 2.5982 3.94907 2.77021 3.78006C3.02711 3.5266 3.32886 3.32317 3.66017 3.18008C4.32778 2.91301 5.07257 2.91301 5.74018 3.18008C6.06935 3.31717 6.36836 3.5176 6.62019 3.77005L7.98017 5.14004L9.34022 3.77005C9.59204 3.5176 9.89099 3.31717 10.2202 3.18008C10.8878 2.91301 11.6326 2.91301 12.3002 3.18008C12.6315 3.32317 12.9333 3.5266 13.1902 3.78006C13.3644 3.94464 13.5098 4.13726 13.6202 4.35V4.35C13.734 4.55128 13.8214 4.7664 13.8802 4.99002V4.99002C13.9402 5.2185 13.9705 5.45373 13.9702 5.68997C13.9839 5.93159 13.9637 6.17404 13.9102 6.41006H13.8802Z" fill="var(--vscode-editor-foreground)"/>
            </svg>
        </button>
        <button class="tool-button show-face-box" type="button" title="QQ表情">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M4.11126 2.17969C5.2624 1.41052 6.61577 1 8.00024 1C9.85675 1 11.6372 1.73754 12.95 3.05029C14.2628 4.36305 15.0002 6.14348 15.0002 8C15.0002 9.38447 14.5897 10.7379 13.8205 11.889C13.0514 13.0402 11.9581 13.9373 10.679 14.4672C9.39993 14.997 7.99244 15.1356 6.63457 14.8655C5.27671 14.5954 4.02943 13.9287 3.05047 12.9497C2.0715 11.9707 1.40485 10.7235 1.13476 9.3656C0.86466 8.00773 1.00326 6.60025 1.53307 5.32117C2.06289 4.04208 2.96011 2.94886 4.11126 2.17969ZM4.6668 12.9888C5.6535 13.6481 6.81355 14 8.00024 14C9.59153 14 11.1176 13.3679 12.2429 12.2427C13.3681 11.1175 14.0002 9.5913 14.0002 8C14.0002 6.81331 13.6484 5.65332 12.9891 4.66663C12.3298 3.67993 11.3927 2.91079 10.2963 2.45667C9.19996 2.00254 7.99359 1.88372 6.8297 2.11523C5.66582 2.34675 4.59674 2.91821 3.75762 3.75732C2.91851 4.59644 2.34704 5.66558 2.11553 6.82947C1.88402 7.99335 2.00284 9.19979 2.45696 10.2961C2.91109 11.3925 3.68011 12.3295 4.6668 12.9888ZM6.50024 7C6.50024 7.55228 6.05253 8 5.50024 8C4.94796 8 4.50024 7.55228 4.50024 7C4.50024 6.44772 4.94796 6 5.50024 6C6.05253 6 6.50024 6.44772 6.50024 7ZM11.5002 7C11.5002 7.55228 11.0525 8 10.5002 8C9.94796 8 9.50024 7.55228 9.50024 7C9.50024 6.44772 9.94796 6 10.5002 6C11.0525 6 11.5002 6.44772 11.5002 7ZM8.00024 11C7.45685 11.0013 6.92328 10.8551 6.45654 10.5768C5.98981 10.2985 5.60742 9.89871 5.35022 9.42004L4.48022 9.90002C4.83037 10.548 5.35265 11.0867 5.98944 11.4568C6.62623 11.8269 7.35284 12.0139 8.08917 11.9973C8.82551 11.9808 9.54301 11.7613 10.1625 11.363C10.7821 10.9647 11.2795 10.403 11.6002 9.73999L10.7003 9.31006C10.4543 9.81684 10.0706 10.2441 9.59308 10.543C9.11558 10.8418 8.56357 11.0002 8.00024 11Z" fill="var(--vscode-editor-foreground)"/>
            </svg>
        </button>
        <button class="tool-button show-at-box" type="button" title="@ AT" style="display: ${webview.c2c ? 'none' : 'block'};">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10.4655 12.36C9.54067 12.896 8.47999 13.1517 7.41251 13.096C6.80294 13.1419 6.19062 13.0561 5.61715 12.8445C5.04367 12.6328 4.52247 12.3002 4.08894 11.8692C3.65541 11.4382 3.31971 10.919 3.10464 10.3468C2.88957 9.77457 2.80017 9.16278 2.84251 8.55295C2.81695 7.82964 2.93757 7.10861 3.19715 6.433C3.45674 5.75739 3.84995 5.14109 4.35325 4.62098C4.85656 4.10086 5.45961 3.68763 6.12634 3.40601C6.79306 3.12438 7.50975 2.98015 8.23351 2.98195C10.6105 2.98195 12.6465 4.35695 12.6465 6.98795C12.6465 9.16995 11.3545 10.648 9.74651 10.648C9.07051 10.648 8.64651 10.374 8.62051 9.73095C8.4313 10.0216 8.1702 10.2583 7.86253 10.4183C7.55486 10.5783 7.21107 10.656 6.86451 10.644C5.89551 10.644 5.23551 9.99895 5.23551 8.72095C5.23551 6.95795 6.38351 5.32095 7.85551 5.32095C8.16506 5.28125 8.47864 5.35303 8.7401 5.52343C9.00156 5.69383 9.19384 5.95172 9.28251 6.25095L9.49351 5.44195H10.3935L9.60051 8.64595C9.37451 9.56195 9.47051 9.86095 9.94251 9.86095C10.9265 9.86095 11.7755 8.65095 11.7755 7.03595C11.7755 4.96795 10.3305 3.77095 8.16451 3.77095C5.52251 3.77095 3.79151 5.90295 3.78351 8.55695C3.74255 9.05277 3.80954 9.55158 3.97985 10.019C4.15016 10.4865 4.41976 10.9115 4.77008 11.2647C5.1204 11.618 5.54311 11.8911 6.00912 12.0654C6.47513 12.2396 6.97336 12.3108 7.46951 12.274C8.44251 12.3142 9.40876 12.0954 10.2695 11.64L10.4655 12.36ZM6.21751 8.63895C6.21751 9.42695 6.52451 9.84495 7.13051 9.84495C7.88851 9.84495 8.51051 9.24495 8.81351 8.01395C9.13651 6.74595 8.84951 6.09995 7.94051 6.09995C6.90051 6.09995 6.21751 7.43895 6.21751 8.63895Z" fill="var(--vscode-editor-foreground)"/>
            </svg>
        </button>
        <div class="input-content" contenteditable="true"></div>
        <button class="send" onclick="sendMessage()">发送</button>
    </div>`
);

// 监听消息事件
webview.on("message", (event) => {
    appendMessage(genUserMessage(event.detail));
});

// 监听通知事件
webview.on("notice", (event) => {
    appendMessage(genSystemMessage(event.detail));
});

// 滑动消息窗口时
document.querySelector(".chat-box").onscroll = () => {
    if (document.querySelector(".chat-box").scrollTop === 0) { // 滑动到顶部加载历史消息
        const msgNode = document.querySelector(".cmsg").attributes;
        getChatHistory((webview.c2c ? msgNode.time.value : msgNode.id.value) ?? "");
    }
};

// 点击分割线时
document.querySelector(".boundary").onmousedown = (mouseEvent) => {
    const dy = mouseEvent.clientY; // 获取按下时鼠标的y坐标
    const upperHeight = document.querySelector(".chat-box").offsetHeight;
    const downHeight = document.querySelector(".chat-input").offsetHeight;
    document.onmousemove = (ev) => { // 拖动鼠标时
        const diff = ev.clientY - dy; // 移动的距离（上移为负，下移为正）
        if (100 < (upperHeight + diff) && 100 < (downHeight - diff)) { // 两个div的最小高度都为100px
            document.querySelector(".chat-box").style.height = `calc(100% - ${downHeight - diff}px)`;
            document.querySelector(".chat-input").style.height = (downHeight - diff) + "px";
            document.querySelectorAll(".chat-tool").forEach((element) => {
                element.style.bottom = document.querySelector(".chat-input").clientHeight + "px";
            });
        }
        document.onmouseup = () => { // 鼠标释放
            document.onmousedown = null;
            document.onmousemove = null;
        };
    };
};

// 界面点击时
document.querySelector("body").onclick = ev => {
    let elem = ev.target;
    if (elem.nodeName === "path") {
        elem = ev.target.parentElement.parentElement;
    }
    if (elem.nodeName === "svg") {
        elem = ev.target.parentElement;
    }
    if (!elem.className.includes("show-stamp-box")) { // 关闭漫游表情栏
        document.querySelector(".stamp-box").style.display = "none";
    }
    if (!elem.className.includes("show-face-box")) { // 关闭QQ表情栏
        document.querySelector(".face-box").style.display = "none";
    }
    if (!elem.className.includes("show-at-box")) { // 关闭AT列表
        document.querySelector(".at-box").style.display = "none";
    }
};

// 打开漫游表情栏
document.querySelector(".show-stamp-box").onclick = () => {
    document.querySelector(".stamp-box").style.display = "block";
    if (!document.querySelector(".stamp-box img")) {
        webview.getRoamingStamp().then((stampList) => {
            stampList.forEach((stampUrl) => {
                document.querySelector(".stamp-box").insertAdjacentHTML("afterbegin", genImage(stampUrl, true));
            });
        });
    }
};

// 打开QQ表情栏
document.querySelector(".show-face-box").onclick = () => {
    document.querySelector(".face-box").style.display = "block";
    if (!document.querySelector(".face-box img")) {
        for (let i = 0; i < 325; i++) {
            if (i === 275 || (i > 247 && i < 260)) {
                continue;
            }
            document.querySelector(".face-box").insertAdjacentHTML("beforeend", genFace(i, true));
        }
    }
};

// 打开AT列表
document.querySelector(".show-at-box").onclick = () => {
    document.querySelector(".at-box").style.display = "block";
    if (!document.querySelector(".at-box div")) {
        // 成员按昵称排序，方便查找
        const memberList = [...memberInfoMap.values()].sort((a, b) => {
            const nameA = a.card ? a.card : a.nickname;
            const nameB = b.card ? b.card : b.nickname;
            return nameA.localeCompare(nameB, "zh-CN");
        });
        memberList.forEach((memberInfo) => {
            document.querySelector(".at-box").insertAdjacentHTML("beforeend", `<div title="${memberInfo.user_id}" onclick="appendAt(${memberInfo.user_id})">${memberInfo.card ? memberInfo.card : memberInfo.nickname}</div>`);
        });
        document.querySelector(".at-box").insertAdjacentHTML("afterbegin", `<div title="all" onclick="appendAt('all')">全体成员</div>`);
    }
};

// 粘贴到输入框时
document.querySelector(".input-content").onpaste = (ev) => {
    if (!ev.clipboardData || !ev.clipboardData.items) { // 剪切板无数据
        return;
    }
    ev.preventDefault(); // 删除链接格式
    Array.from(ev.clipboardData.items).map((item) => {
        if (item.kind === "string") { // 文字
            if (item.type === "text/plain") { // 只粘贴纯文本
                item.getAsString((str) => {
                    document.querySelector(".input-content").insertAdjacentText("beforeend", str);
                });
            }
        } else if (item.kind === "file") { // 文件
            if (item.type.startsWith("image")) { // 图片
                const reader = new FileReader();
                reader.onload = () => {
                    document.querySelector(".input-content").insertAdjacentHTML("beforeend", genImage(reader.result));
                };
                reader.readAsDataURL(item.getAsFile());
            }
        } else { // 其他
            new Error("unsupported type!");
        }
    });
};

// Enter发送消息，Shift+Enter换行
window.onkeydown = (event) => {
    if (event.keyCode !== 13) {
        return;
    }
    if (!event.shiftKey) {
        sendMessage();
    }
};

// 加载群/好友信息，获取历史消息
(() => {
    // 私聊获取好友信息，群聊获取群友信息
    webview.c2c ? updateFriendInfo() : updateGroupInfo();
    // 加载历史消息
    getChatHistory();
})();