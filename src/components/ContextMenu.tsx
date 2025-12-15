interface ContextMenuProps {
  x: number;
  y: number;
  layerId: string;
  onDuplicate: () => void;
  onDelete: () => void;
}

export const ContextMenu = ({
  x,
  y,
  onDuplicate,
  onDelete,
}: ContextMenuProps) => {
  return (
    <div
      className="context-menu"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 10000,
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <button onClick={onDuplicate}>Duplicate</button>
      <button className="danger" onClick={onDelete}>
        Delete
      </button>
    </div>
  );
};

