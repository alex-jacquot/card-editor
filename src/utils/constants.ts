export const STORAGE_KEY = 'card-editor:layers';
export const UNDO_HISTORY_SIZE_KEY = 'card-editor:undo-history-size';
export const DEFAULT_UNDO_HISTORY_SIZE = 50;

export const FONT_FAMILIES = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Palatino', label: 'Palatino' },
  { value: 'Garamond', label: 'Garamond' },
  { value: 'Bookman', label: 'Bookman' },
  { value: 'Comic Sans MS', label: 'Comic Sans MS' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Impact', label: 'Impact' },
];

export const textAsset = {
  id: 'text-box',
  name: 'Text Box',
  category: 'Text',
  type: 'text' as const,
};

