import axios from "axios";
import fromEnv from "../config/fromEnv.ts";

const baseUrl = fromEnv.BASE_API_URL;

export const refreshAgentToken = (twitterId: string) =>
    post(baseUrl + '/auth/agentGetClient', {twitterId})

function get(url: string, params?: Object) {
    return new Promise((resolve, reject) => {
      axios
        .get(url, {
          params: params
        })
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          console.log("network err", err);
          if (err.response) {
            reject(err.response.status);
            return;
          } else {
            reject(500);
          }
        }).then(resolve);
    });
  }
  
  export function post(url: string, params?: object) {
    return new Promise((resolve, reject) => {
      axios
        .post(url, params)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          if (err.response) {
            reject(err.response.status);
            return;
          }
          reject(500);
        });
    });
  }
  
  export function put(url: string, params?: object) {
    return new Promise((resolve, reject) => {
      axios
        .put(url, params)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          if (err.response) {
            reject(err.response.status);
            return;
          }
          reject(500);
        });
    });
  }
  