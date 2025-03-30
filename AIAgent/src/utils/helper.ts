// @ts-nocheck
import moment from "moment";
import dotenv from "dotenv";

dotenv.config();

moment.updateLocale('en', {
  week: {
    dow: 1, // Monday is the first day of the week.
  },
});

export const b64uLookup = {
  "/": "_",
  _: "/",
  "+": "-",
  "-": "+",
  "=": ".",
  ".": "=",
  "N": 'p',
  "p": 'N'
};
export const b64uEnc = (str) =>
  Buffer.from(str)
    .toString("base64")
    .replace(/(\+|\/|=)/g, (m) => b64uLookup[m]);

export const b64uDec = (str) =>
  Buffer.from(
    str.replace(/(-|_|\.)/g, (m) => b64uLookup[m]),
    "base64"
  ).toString();

export const sleep = async (interval) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, interval * 1000);
  })
}

/**
 * It is recommended to sleep >= 10s, and use this function only if the function needs to end in advance
 * @param {*} interval sleeping time
 * @param {*} callback step callback, Returns true to end sleep early.
 * @param {*} step Check interval, seconds
 */
export const sleep2 = async (interval, callback: () => {} = null, step = 5) => {
  let t = Date.now() + interval * 1000;
  while (Date.now() < t) {
    await sleep(step);
    if (callback && callback()) break;
  }
};

export const u8arryToHex = (buffer) => {
  return [...new Uint8Array(buffer)]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('')
}

export const hexTou8array = (hex) => {
  return Uint8Array.from(hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))
}

export const stringToHex = (str) => {
  let val = "";
  for (let i = 0; i < str.length; i++) {
    if (val == "") {
      val = str.charCodeAt(i).toString(16);
    } else {
      val += str.charCodeAt(i).toString(16);
    }
  }
  return val;
}

export const hexToString = (str) => {
  if (str.length % 2 !== 0) {
    console.log('Not a hex');
    return ""
  }
  let val = "";
  for (let i = 0; i < str.length; i += 2) {
    const n = parseInt(str[i] + str[i + 1], 16)
    val += String.fromCharCode(n);
  }
  return val;
}

export const format = (time) => {
  return moment(time).utc().format("YYYY-MM-DD HH:mm:ss");
};

export function hasChinese(text) {
  let reg = RegExp("[\\u4E00-\\u9FFF]+", "g");
  return reg.test(text);
}

export function getTitle(content, len, word = 6) {
  if (content.length <= len) return content;
  let result = content;
  let index = result.indexOf("\n");
  if (index > word) {
    result = result.substring(0, index);
  }
  index = result.indexOf(".");
  if (index > word) {
    result = result.substring(0, index);
  }
  index = result.indexOf("。");
  if (index > word) {
    result = result.substring(0, index);
  }
  index = result.indexOf(",");
  if (index > word) {
    result = result.substring(0, index);
  }
  index = result.indexOf("，");
  if (index > word) {
    result = result.substring(0, index);
  }
  if (result.length > len) {
    if (hasChinese(result) == false && result.indexOf(" ")) {
      let strs = result.split(" ");
      if (strs.length > word) {
        return strs.slice(0, word).join(" ");
      } else if (strs.length != 1) {
        return strs.join(" ");
      }
    }
  } else {
    return result;
  }
  return result.substring(0, len) + "...";
}

export function extractTitle(text) {
  // 识别完整表情符号的正则表达式
  const emojiRegex = /([\uD83C-\uDBFF\uDC00-\uDFFF]+|[\u200D\uFE0F])/gu;
  
  let currentLength = 0;
  let result = '';
  
  // 遍历字符，逐步构建标题
  for (const char of text) {
      // 如果匹配到的是表情符号，完整添加
      if (char.match(emojiRegex)) {
          if (currentLength + 2 > 20) break; // 表情符号按2个长度算
          result += char;
          currentLength += 2;
      } 
      // 如果遇到标点符号或空格，并且当前长度已超出阈值，可以提前截断
      else if ([' ', '，', '。', '！', '？', '\n'].includes(char) && currentLength > 10) {
          break;
      }
      // 普通字符处理
      else {
          if (currentLength + 1 > 20) break; // 单个字符按1个长度算
          result += char;
          currentLength += 1;
      }
  }
  
  return result.trim();
}

export function getDayNumber(date?) {
  date = date ?? moment();
  return moment(date).utc().startOf('days').unix() / 86400;
}

export function getMondayDayNumber() {
  return moment().utc().startOf('week').unix() / 86400;
}