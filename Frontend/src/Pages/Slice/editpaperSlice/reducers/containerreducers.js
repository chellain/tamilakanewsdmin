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
              margin: 0
            },
            nestedContainers: [],
            sliders: [],
            lines: []
          }
        }
      };
    }
  },

  updateContainerGrid(state, action) {
    const { catName, containerId, columns, gap } = action.payload;
    const cont = state.pages
      .find(p => p.catName === catName)
      ?.containers.find(c => c.id === containerId);

    if (cont) {
      cont.grid.columns = columns;
      cont.grid.gap = gap;
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
    const { catName, containerId, padding, margin } = action.payload;
    const cont = state.pages
      .find(p => p.catName === catName)
      ?.containers.find(c => c.id === containerId);

    if (cont) {
      if (!cont.spacing) cont.spacing = { padding: 0, margin: 0 };
      if (padding !== undefined) cont.spacing.padding = padding;
      if (margin !== undefined) cont.spacing.margin = margin;
    }
    logState(state, "updateContainerSpacing");
  }
};
