export const common = {
    
    getLoginState(store){
        var userInfo = {};
        var isLogin = false;
        if (store.state.loginUser !== null){
            if (store.state.loginUser.loginType === 'api'){
                userInfo['name'] = store.state.loginUser.api.user.name;
                userInfo['email'] = store.state.loginUser.api.user.email;
                isLogin = true;
            }
            else if (store.state.loginUser.loginType === 'google'){
                userInfo['name'] = store.state.loginUser.google.user.name;
                userInfo['email'] = store.state.loginUser.google.user.email;
                isLogin = true;
            }
            else if (store.state.loginUser.loginType === 'fb'){
                userInfo['name'] = store.state.loginUser.fb.user.name;
                isLogin = true;
            }
            else{
                userInfo['name'] = '';
                isLogin = false;
            }
        }
        else{
            userInfo['name'] = ''
            isLogin = false;
        }
        return isLogin;
    },
    getResortSize(_key) {
        const resortSizeList = {
            0:'Intimate (less < 50 rooms)', 
            1:'Moderate (more > 50 rooms)',
            2:'Extensive (more > 100 rooms)'
        }
        return resortSizeList[_key];
    },
    
    
}