import {
  createSlice,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import { apiStarted } from "../api";
import * as endpoints from "../endpoints";
import { cacheProps, addLastFetch, cacheNotExpired } from "../helpers";
import { actions as artifactActions } from "./artifacts";
import {
  portfolioFetchedAll,
  portfolioFetchedPages,
  pageFetchedArtifacts,
  pageFetchedAll,
} from "./actions";
import { selectToken, selectUsername } from "./auth";

export const adapter = createEntityAdapter();

const slice = createSlice({
  name: "page",
  initialState: adapter.getInitialState(cacheProps),
  reducers: {
    pageRequestedMany: (pages, action) => {
      pages.loading = true;
      pages.error = null;
    },
    pageReceivedMany: (pages, action) => {
      adapter.upsertMany(
        pages,
        action.payload.map(page => addLastFetch(page))
      );
      pages.lastFetch = Date.now();
      pages.loading = false;
      pages.error = null;
    },
    pageRequestManyFailed: (pages, action) => {
      pages.loading = false;
      pages.error = action.payload;
    },
    pageRequestedOne: (pages, action) => {
      pages.loading = true;
      pages.error = null;
    },
    pageReceivedOne: (pages, action) => {
      adapter.upsertOne(pages, addLastFetch(action.payload));
      pages.loading = false;
      pages.error = null;
    },
    pageRequestOneFailed: (pages, action) => {
      pages.loading = false;
      pages.error = action.payload;
    },
    pagesUpdating: (pages, action) => {
      pages.loading = true;
      pages.error = null;
    },
    pageUpdating: (pages, action) => {
      const pageId = action.request.id;
      if (pages.entities[pageId]) {
        pages.entities[pageId].loading = true;
      }
      pages.error = null;
    },
    pagesFailed: (pages, action) => {
      pages.loading = false;
      pages.error = action.payload;
    },
    pageCreated: (pages, action) => {
      const page = addLastFetch(action.payload);
      adapter.upsertOne(pages, { ...page, loading: false });
      pages.loading = false;
      pages.error = null;
    },
    pageUpdated: (pages, action) => {
      const page = addLastFetch(action.payload);
      adapter.upsertOne(pages, { ...page, loading: false });
      pages.error = null;
    },
    pageDeleted: (pages, action) => {
      const pageId = action.request.id;
      adapter.removeOne(pages, pageId);
      pages.error = null;
    },
    pageReceivedOneAll: (pages, action) => {
      const { page } = addLastFetch(action.payload);
      adapter.upsertOne(pages, page);
      pages.error = null;
    },
  },
  extraReducers: {
    [artifactActions.artifactCreated]: (pages, action) => {
      const { pageId, id } = action.payload;
      if (!pages.entities[pageId] || !pages.entities[pageId].pages) {
        adapter.upsertOne(pages, {
          id: pageId,
          artifacts: [{ id }],
        });
      } else {
        pages.entities[pageId].artifacts.push({ id });
      }
    },
    [artifactActions.artifactDeleted]: (pages, action) => {
      // TODO
    },
    [portfolioFetchedAll]: (pages, action) => {
      const { pages: receivedPages } = action.payload;
      adapter.upsertMany(
        pages,
        receivedPages.map(page => {
          page.lastFetch = Date.now();
          page.artifactsLastFetch = Date.now();
          return page;
        })
      );
    },
    [portfolioFetchedPages]: (pages, action) => {
      const receivedPages = action.payload;
      adapter.upsertMany(
        pages,
        receivedPages.map(page => addLastFetch(page))
      );
    },
    [pageFetchedAll]: (pages, action) => {
      const { page } = action.payload;
      page.lastFetch = Date.now();
      page.artifactsLastFetch = Date.now();
      adapter.upsertOne(pages, page);
      pages.loading = false;
    },
    [pageFetchedArtifacts]: (pages, action) => {
      const { id } = action.request.data;
      const page = {
        id,
        artifactsLastFetch: Date.now(),
      };
      adapter.upsertOne(pages, page);
    },
  },
});

// Reducer
export default slice.reducer;

// Actions
const {
  pageRequestedOne,
  pageReceivedOne,
  pageRequestOneFailed,
  pageCreated,
  pageUpdating,
  pageUpdated,
  pageDeleted,
  pagesUpdating,
  pagesFailed,
} = slice.actions;
export const actions = slice.actions;

// Selectors
export const {
  selectById: selectPageById,
  selectIds: selectPageIds,
  selectEntities: selectPageEntities,
  selectAll: selectAllPages,
  selectTotal: selectTotalPages,
} = adapter.getSelectors(state => state.pages);
export const selectPagesSlice = state => state.pages;

export const selectPageArtifacts = createSelector(selectPageById, page =>
  page ? page.artifacts || [] : undefined
);

export const selectPageName = createSelector(selectPageById, page =>
  page ? page.name || "" : undefined
);

export const selectPageType = createSelector(selectPageById, page =>
  page ? page.type || "" : undefined
);

export const selectPageArtifactIds = createSelector(
  selectPageArtifacts,
  artifacts =>
    artifacts ? artifacts.map(artifact => artifact.artifactId) || [] : undefined
);

// Action Creators
// load a page by id, with _all_ properties
export const fetchPage = (id, cache = true) => (dispatch, getState) => {
  const page = selectPageById(getState(), id);
  if (cache && page && cacheNotExpired(page.lastFetch)) return;

  return dispatch(
    apiStarted({
      url: endpoints.pagesById(id),
      method: "get",
      onStart: pageRequestedOne.type,
      onSuccess: pageReceivedOne.type,
      onFailure: pageRequestOneFailed.type,
    })
  );
};

// fetch entire page by page id, including artifacts
export const fetchEntirePage = (pageId, cache = true) => (
  dispatch,
  getState
) => {
  const page = selectPageById(getState(), pageId);
  if (
    cache &&
    page &&
    cacheNotExpired(page.lastFetch) &&
    cacheNotExpired(page.artifactsLastFetch)
  )
    return;
  return dispatch(
    apiStarted({
      url: endpoints.fullPageById(pageId),
      onStart: pageRequestedOne.type,
      onSuccess: pageFetchedAll.type,
      onFailure: pageRequestOneFailed.type,
    })
  );
};

// fetch all artifacts in page by page id
export const fetchPageArtifacts = (pageId, cache = true) => (
  dispatch,
  getState
) => {
  const page = selectPageById(getState(), pageId);
  if (cache && page && cacheNotExpired(page.artifactsLastFetch)) return;

  return dispatch(
    apiStarted({
      url: endpoints.artifactsByPageId(pageId),
      data: { id: pageId },
      onStart: pageRequestedOne.type,
      onSuccess: pageFetchedArtifacts.type,
      onFailure: pageRequestOneFailed.type,
    })
  );
};

// create a new page
export const createPage = (page = {}) => (dispatch, getState) => {
  const token = selectToken(getState());
  const username = selectUsername(getState());
  return dispatch(
    apiStarted({
      url: endpoints.pagesByUsername(username),
      method: "post",
      data: page,
      token,
      onStart: pagesUpdating.type,
      onFailure: pagesFailed.type,
      onSuccess: pageCreated.type,
    })
  );
};

export const changePageOptions = (id, data) => (dispatch, getState) => {
  const token = selectToken(getState());

  return dispatch(
    apiStarted({
      url: endpoints.pagesById(id),
      method: "patch",
      data,
      token,
      req: { id },
      onStart: pageUpdating.type,
      onFailure: pagesFailed.type,
      onSuccess: pageUpdated.type,
    })
  );
};

export const renamePage = (id, name) => changePageOptions(id, { name });

// delete a page by id
export const deletePage = id => (dispatch, getState) => {
  const token = selectToken(getState());
  const username = selectUsername(getState());

  return dispatch(
    apiStarted({
      url: endpoints.pagesById(id),
      method: "delete",
      req: { username, id },
      token,
      onStart: pageUpdating.type,
      onFailure: pagesFailed.type,
      onSuccess: pageDeleted.type,
    })
  );
};
