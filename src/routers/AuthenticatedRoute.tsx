import { useAuth, } from "firebase/authManager";
import { Redirect, Route } from "react-router-dom";
import ncNanoId from "utils/ncNanoId";

export const AuthenticatedRoute = ({ component: C, ...props }: any) => {
    const { user } = useAuth();
    return (
        <Route
            key={props.path}
            {...props}
            render={routeProps =>
                user ? <C key={ncNanoId()} {...routeProps} /> : <Redirect to="/login" />
            }
        />
    )
};