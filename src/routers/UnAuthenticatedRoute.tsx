import { Route } from "react-router-dom";
import ncNanoId from "utils/ncNanoId";

export const UnAuthenticatedRoute = ({ component: C, ...props }: any) => {
  return (
    <Route
      key={props.path}
      {...props}
      render={routeProps => <C key={ncNanoId()} {...routeProps} />
      }
    />
  )
};