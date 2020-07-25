import React, { Fragment } from "react";
import { useAuth0 } from "../services/auth/react-auth0-spa";
import { PrivateMainPage } from "./private-main.page";

/**
 * ログイン時に表示するモジュール
 * https://auth0.com/docs/quickstart/spa/react/01-login
 * 本体はPrivateMainPage
 */
const PrivatePage = () => {
    const { loading, isAuthenticated, loginWithRedirect } = useAuth0();

    if (loading) {
        return <div>Loading...</div>;
    }
    if (!isAuthenticated){
        loginWithRedirect();
        return null;
    }

    return (
        <Fragment>
            <PrivateMainPage/>
        </Fragment>
    );
};

export default PrivatePage;