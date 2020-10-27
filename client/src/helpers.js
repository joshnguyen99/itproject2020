import { useSelector } from "react-redux";
import { selectPortfolioIsEditing, selectPortfolioByUsername } from "./store";

export const isTrue = value => value === "true" || value === true;

export const usePath = userId => {
  const editing = useSelector(state => selectPortfolioIsEditing(state, userId));

  const singlePage = useSelector(
    state => selectPortfolioByUsername(state, userId).singlePage
  );
  const path = editing ? "/editor" : `/u/${userId}`;
  const sep = singlePage ? "#" : "";

  return pageName =>
    pageName === "" || pageName === undefined
      ? path
      : `${path}/${sep}${pageName}`;
};