import { nanoid } from "@reduxjs/toolkit";
import { logState } from "../utils/sliceHelpers";

export const containerReducers = {
  addContainer: {
    reducer(state, action) {
      const { catName, container } = action.payload;
      const page = state.pages.find(p => p.catName === catName);
      if (page) page.containers.push(container);
      logState(state, "addContainer");
    },
    prepare(catName) {
      return {
        payload: {
          catName,
          container: {
            id: nanoid(),
            grid: {
              columns: 1,
              gap: 0
            },
            items: [],
            header: {
              enabled: false,
              tam: "",
              eng: ""
            },
            spacing: {
              padding: 0,
              margin: 0,
              width: 0,
              height: 0
            },
            autoPopulate: null,
            nestedContainers: [],
            sliders: [],
            lines: []
          }
        }
      };
    }
  },

  updateContainerGrid(state, action) {
    const { catName, containerId, columns, gap, span } = action.payload;
    const cont = state.pages
      .find(p => p.catName === catName)
      ?.containers.find(c => c.id === containerId);

    if (cont) {
      if (columns !== undefined) cont.grid.columns = columns;
      if (gap !== undefined) cont.grid.gap = gap;
      if (span !== undefined) cont.grid.span = span;
    }
    logState(state, "updateContainerGrid");
  },

  deleteContainer(state, action) {
    const { catName, containerId } = action.payload;
    const page = state.pages.find(p => p.catName === catName);
    if (page) {
      page.containers = page.containers.filter(c => c.id !== containerId);
    }
    logState(state, "deleteContainer");
  },

  updateContainerHeader(state, action) {
    const { catName, containerId, enabled, tam, eng, title } = action.payload;
    const cont = state.pages
      .find(p => p.catName === catName)
      ?.containers.find(c => c.id === containerId);

    if (cont) {
      if (!cont.header) cont.header = { enabled: false, tam: "", eng: "" };
      if (enabled !== undefined) cont.header.enabled = enabled;
      if (tam !== undefined) cont.header.tam = tam;
      if (eng !== undefined) cont.header.eng = eng;
      if (title !== undefined) {
        if (!cont.header.tam) cont.header.tam = title;
        if (cont.header.eng === undefined) cont.header.eng = "";
      }
    }
    logState(state, "updateContainerHeader");
  },

  updateContainerSpacing(state, action) {
    const { catName, containerId, padding, margin, width, height } = action.payload;
    const cont = state.pages
      .find(p => p.catName === catName)
      ?.containers.find(c => c.id === containerId);

    if (cont) {
      if (!cont.spacing) cont.spacing = { padding: 0, margin: 0, width: 0, height: 0 };
      if (padding !== undefined) cont.spacing.padding = padding;
      if (margin !== undefined) cont.spacing.margin = margin;
      if (width !== undefined) cont.spacing.width = width;
      if (height !== undefined) cont.spacing.height = height;
    }
    logState(state, "updateContainerSpacing");
  },

  updateContainerAutoPopulate(state, action) {
    const { catName, containerId, autoPopulate } = action.payload;
    const cont = state.pages
      .find(p => p.catName === catName)
      ?.containers.find(c => c.id === containerId);

    if (cont) {
      cont.autoPopulate = autoPopulate ? { ...autoPopulate } : null;
    }
    logState(state, "updateContainerAutoPopulate");
  }
};
