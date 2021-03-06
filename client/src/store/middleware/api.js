import axios from "axios";
import * as actions from "../api";
import * as endpoints from "../endpoints";

// Inspired by https://github.com/ohansemmanuel/fake-medium/

const apiMiddleware = ({ dispatch }) => next => async action => {
  // allow logging of api calls to Redux Dev Tools
  if (action.type !== actions.apiStarted.type) return next(action);

  const {
    url,
    method,
    data,
    token,
    onStart,
    onSuccess,
    onFailure,
    hideErrorToast = false,
    headers,
    req,
    multipart,
  } = action.payload;

  axios.defaults.baseURL = endpoints.baseURL;

  const dataOrParams = ["get"].includes(method) ? "params" : "data";

  axios.defaults.headers.common["Content-Type"] = multipart
    ? "multipart/form-data"
    : "application/json";
  if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

  const request = {
    url,
    method,
    data: multipart ? null : data, // don't put non-serializable values in the store
    token,
    ...req,
  };

  if (onStart) dispatch({ type: onStart, request });
  next(action);

  // make api call
  try {
    const response = await axios.request({
      url,
      method,
      [dataOrParams]: data,
      headers,
    });

    // General success action
    dispatch(actions.apiEnded(response.data));

    // Specific action
    if (onSuccess)
      dispatch({ type: onSuccess, payload: response.data, request });
  } catch (error) {
    // General error action
    const returnedError = {
      message: error.message,
      data: error.response ? error.response.data : null,
      hideErrorToast,
      request,
    };
    if (process.env.NODE_ENV === "development") console.log(error);
    dispatch(actions.apiErrored(returnedError));
    // Specific
    if (onFailure)
      dispatch({
        type: onFailure,
        payload: { ...returnedError, hideErrorToast: true },
      });

    if (error.response && error.response.status === 403) {
      dispatch(actions.accessDenied(window.location.pathname));
    }
  }
};

export default apiMiddleware;
