import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

const ToolbarDropdown = ({ trigger, items }) => {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>

            <DropdownMenu.Content className="tiptap-dropdown">
                {items.map((item) => (
                    <DropdownMenu.Item key={item.label} onClick={item.onClick} disabled={item.disabled} className="tiptap-dropdown-item">
                        {item.label}
                    </DropdownMenu.Item>
                ))}
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
};

export default ToolbarDropdown;
