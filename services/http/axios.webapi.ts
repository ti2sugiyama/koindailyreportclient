import axios from 'axios';

const ret = axios.create({
    baseURL: process.env.REACT_APP_API_URL
//    timeout: 1000,
});


ret.interceptors.request.use(function (config) {
    config.headers.Authorization= localStorage.getItem('id_token');
    return config;
}, function (error) {
    return Promise.reject(error);
});

ret.interceptors.response.use(function (response) {
    if(response.status===401){
        //権限が切れた場合の処理を追加してあげると親切
        return response;
    } else {
        return response;
    }
}, function (error) {
    return Promise.reject(error);
});


export default ret;