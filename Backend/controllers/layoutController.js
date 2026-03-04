import Layout from "../models/Layout.js";

const buildLayoutPayload = (body = {}) => ({
  pages: Array.isArray(body.pages) ? body.pages : [],
  presetContainers: Array.isArray(body.presetContainers) ? body.presetContainers : [],
  activePage: typeof body.activePage === "string" && body.activePage.length > 0 ? body.activePage : "main",
  activeLineId: body.activeLineId ?? null
});

export const getLayout = async (req, res) => {
  try {
    // Always return the most recently updated layout to match upsert behavior
    const layout = await Layout.findOne().sort({ updatedAt: -1, createdAt: -1 });
    res.json(layout);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch layout", error: error.message });
  }
};

export const getLayoutById = async (req, res) => {
  try {
    const layout = await Layout.findById(req.params.id);
    if (!layout) {
      return res.status(404).json({ message: "Layout not found" });
    }
    res.json(layout);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch layout", error: error.message });
  }
};

export const createLayout = async (req, res) => {
  try {
    const payload = buildLayoutPayload(req.body);
    const created = await Layout.create(payload);
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: "Failed to create layout", error: error.message });
  }
};

export const upsertLayout = async (req, res) => {
  try {
    const payload = buildLayoutPayload(req.body);
    const updated = await Layout.findOneAndUpdate({}, payload, {
      new: true,
      upsert: true,
      sort: { updatedAt: -1, createdAt: -1 },
      setDefaultsOnInsert: true
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: "Failed to save layout", error: error.message });
  }
};

export const updateLayout = async (req, res) => {
  try {
    const payload = buildLayoutPayload(req.body);
    const updated = await Layout.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Layout not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: "Failed to update layout", error: error.message });
  }
};

export const deleteLayout = async (req, res) => {
  try {
    const deleted = await Layout.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Layout not found" });
    }
    res.json({ message: "Layout deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete layout", error: error.message });
  }
};

const findNestedContainer = (containers, targetId) => {
  for (const cont of containers || []) {
    if (cont.id === targetId) return cont;
    if (Array.isArray(cont.nestedContainers) && cont.nestedContainers.length > 0) {
      const found = findNestedContainer(cont.nestedContainers, targetId);
      if (found) return found;
    }
  }
  return null;
};

export const votePoll = async (req, res) => {
  try {
    const { catName, containerId, slotId, isNested, parentContainerId, optionIndex } = req.body || {};

    if (!catName || !containerId || !slotId) {
      return res.status(400).json({ message: "catName, containerId, and slotId are required" });
    }

    const idx = Number(optionIndex);
    if (Number.isNaN(idx)) {
      return res.status(400).json({ message: "optionIndex must be a number" });
    }

    const layout = await Layout.findOne().sort({ updatedAt: -1, createdAt: -1 });
    if (!layout) {
      return res.status(404).json({ message: "Layout not found" });
    }

    const page = (layout.pages || []).find((p) => p.catName === catName);
    if (!page) {
      return res.status(404).json({ message: "Page not found" });
    }

    let container = null;
    if (isNested && parentContainerId) {
      const parent = findNestedContainer(page.containers || [], parentContainerId);
      container = parent?.nestedContainers?.find((nc) => nc.id === containerId) || null;
    } else {
      container = (page.containers || []).find((c) => c.id === containerId) || null;
    }

    if (!container) {
      return res.status(404).json({ message: "Container not found" });
    }

    const item = (container.items || []).find((i) => i.slotId === slotId);
    if (!item || !item.pollData) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (!Array.isArray(item.pollData.options) || !item.pollData.options[idx]) {
      return res.status(400).json({ message: "Invalid poll option" });
    }

    item.pollData.options[idx].votes = (item.pollData.options[idx].votes || 0) + 1;
    item.pollData.totalVotes = item.pollData.options.reduce(
      (sum, opt) => sum + (opt.votes || 0),
      0
    );

    layout.markModified("pages");
    await layout.save();

    res.json({ pollData: item.pollData });
  } catch (error) {
    res.status(500).json({ message: "Failed to vote on poll", error: error.message });
  }
};
