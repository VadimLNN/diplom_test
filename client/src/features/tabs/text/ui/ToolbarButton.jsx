import * as Tooltip from "@radix-ui/react-tooltip";

const ToolbarButton = ({ icon, label, onClick, active = false, disabled = false }) => {
    return (
        <Tooltip.Root>
            <Tooltip.Trigger asChild>
                <button
                    type="button"
                    aria-label={label}
                    aria-pressed={active}
                    disabled={disabled}
                    onClick={onClick}
                    className={`tiptap-button ${active ? "active" : ""}`}
                >
                    {icon}
                </button>
            </Tooltip.Trigger>
            <Tooltip.Content side="bottom">{label}</Tooltip.Content>
        </Tooltip.Root>
    );
};

export default ToolbarButton;
