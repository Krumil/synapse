"use client";

import { ReactNode, useState, createContext, useContext, useEffect, useRef, useCallback } from "react";
import { Responsive, WidthProvider, Layout } from "react-grid-layout";
import { ToolCard, ToolCardTitle, ToolCardContent } from "@/components/ui/tool-card";
import { useTheme } from "next-themes";
import { getToolDimensions, ToolDimensions } from "@/components/app/Chat/ToolComponents/ToolComponentRegistry";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

// Counter to ensure unique IDs
let itemCounter = 0;

type GridItem = {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    maxW?: number;
    minH?: number;
    maxH?: number;
    static?: boolean;
    component: ReactNode;
    isChat?: boolean;
    header?: ReactNode;
};

type GridContextType = {
    addGridItem: (component: ReactNode, header?: ReactNode) => void;
    addPositionedGridItem: (
        component: ReactNode,
        header?: ReactNode,
        position?: {
            x?: number;
            y?: number;
            w?: number;
            h?: number;
            minW?: number;
            maxW?: number;
            minH?: number;
            maxH?: number;
            isChat?: boolean;
        }
    ) => void;
    addToolToGrid: (
        component: ReactNode,
        header?: ReactNode,
        toolType?: string,
        overrideDimensions?: Partial<ToolDimensions>
    ) => void;
    addToolWithDimensions: (component: ReactNode, dimensions: Partial<ToolDimensions>, header?: ReactNode) => void;
    addChatComponent: (component: ReactNode, header?: ReactNode) => void;
    removeGridItem: (itemId: string) => void;
};

const GridContext = createContext<GridContextType | null>(null);

export const useGrid = () => {
    const context = useContext(GridContext);
    if (!context) {
        throw new Error("useGrid must be used within a GridProvider");
    }
    return context;
};

type GridLayoutProps = {
    children: ReactNode;
};

export function GridLayout({ children }: GridLayoutProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState<number>(0);
    const [containerHeight, setContainerHeight] = useState<number>(0);
    const [rowHeight, setRowHeight] = useState<number>(0);
    const { theme } = useTheme();

    useEffect(() => {
        setWidth(window.innerWidth);
        setContainerHeight(window.innerHeight);
        setRowHeight(Math.floor((window.innerHeight - 100) / 2));
    }, []);

    const [gridItems, setGridItems] = useState<GridItem[]>([]);

    // Helper function to generate unique IDs
    const generateUniqueId = (prefix: string = "item") => {
        itemCounter++;
        return `${prefix}-${itemCounter}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    // Helper function to find next available position
    const findNextAvailablePosition = (
        items: GridItem[],
        w: number = 1,
        h: number = 1,
        cols: number = 3,
        isChat: boolean = false
    ) => {
        // For chat components, try to place them in the center
        if (isChat) {
            const centerX = Math.floor(cols / 2); // Center column (1 for 3-column grid)
            const centerY = 0; // Start at the top, but could be adjusted

            // Check if center position is available
            const maxY = Math.max(...items.map((item) => item.y + item.h), 0);
            const grid: boolean[][] = Array(Math.max(maxY + h + 2, centerY + h + 1))
                .fill(null)
                .map(() => Array(cols).fill(false));

            // Mark occupied positions
            items.forEach((item) => {
                for (let y = item.y; y < item.y + item.h; y++) {
                    for (let x = item.x; x < item.x + item.w; x++) {
                        if (grid[y] && grid[y][x] !== undefined) {
                            grid[y][x] = true;
                        }
                    }
                }
            });

            // Check if center position is free
            let canPlaceAtCenter = true;
            for (let dy = 0; dy < h && canPlaceAtCenter; dy++) {
                for (let dx = 0; dx < w && canPlaceAtCenter; dx++) {
                    if (grid[centerY + dy] && grid[centerY + dy][centerX + dx]) {
                        canPlaceAtCenter = false;
                    }
                }
            }

            if (canPlaceAtCenter) {
                return { x: centerX, y: centerY };
            }
        }

        // Original logic for non-chat components or when center is not available
        const maxY = Math.max(...items.map((item) => item.y + item.h), 0);
        const grid: boolean[][] = Array(maxY + h + 2)
            .fill(null)
            .map(() => Array(cols).fill(false));

        // Mark occupied positions
        items.forEach((item) => {
            for (let y = item.y; y < item.y + item.h; y++) {
                for (let x = item.x; x < item.x + item.w; x++) {
                    if (grid[y] && grid[y][x] !== undefined) {
                        grid[y][x] = true;
                    }
                }
            }
        });

        // Find first available position
        for (let y = 0; y < grid.length - h + 1; y++) {
            for (let x = 0; x <= cols - w; x++) {
                let canPlace = true;

                // Check if the area is free
                for (let dy = 0; dy < h && canPlace; dy++) {
                    for (let dx = 0; dx < w && canPlace; dx++) {
                        if (grid[y + dy] && grid[y + dy][x + dx]) {
                            canPlace = false;
                        }
                    }
                }

                if (canPlace) {
                    return { x, y };
                }
            }
        }

        // If no position found, place at the bottom
        return { x: 0, y: maxY + 1 };
    };

    const addGridItem = useCallback((component: ReactNode, header?: ReactNode) => {
        const id = generateUniqueId("item");
        setGridItems((prev) => {
            const position = findNextAvailablePosition(prev, 1, 1);
            const newItems = [
                ...prev,
                {
                    i: id,
                    x: position.x,
                    y: position.y,
                    w: 1,
                    h: 1,
                    minW: 1,
                    maxW: 2,
                    minH: 1,
                    maxH: 3,
                    component,
                    isChat: false,
                    header: header || `Component ${id}`,
                },
            ];
            return newItems;
        });
    }, []);

    const addPositionedGridItem = useCallback(
        (
            component: ReactNode,
            header?: ReactNode,
            position?: {
                x?: number;
                y?: number;
                w?: number;
                h?: number;
                minW?: number;
                maxW?: number;
                minH?: number;
                maxH?: number;
                isChat?: boolean;
            }
        ) => {
            const id = generateUniqueId("item");
            setGridItems((prev) => {
                const w = position?.w ?? 1;
                const h = position?.h ?? 1;
                const smartPosition =
                    position?.x !== undefined && position?.y !== undefined
                        ? { x: position.x, y: position.y }
                        : findNextAvailablePosition(prev, w, h);

                const newItems = [
                    ...prev,
                    {
                        i: id,
                        x: smartPosition.x,
                        y: smartPosition.y,
                        w,
                        h,
                        minW: position?.minW ?? 1,
                        maxW: position?.maxW ?? 2,
                        minH: position?.minH ?? 1,
                        maxH: position?.maxH ?? 3,
                        component,
                        isChat: position?.isChat ?? false,
                        header: header || `Component ${id}`,
                    },
                ];
                return newItems;
            });
        },
        []
    );

    const addToolToGrid = useCallback(
        (component: ReactNode, header?: ReactNode, toolType?: string, overrideDimensions?: Partial<ToolDimensions>) => {
            const id = generateUniqueId("tool");

            // Get tool-specific dimensions or use defaults
            const toolDimensions = toolType ? getToolDimensions(toolType) : {};
            const finalDimensions = { ...toolDimensions, ...overrideDimensions };

            setGridItems((prev) => {
                const w = finalDimensions.w ?? 1;
                const h = finalDimensions.h ?? 1;
                const smartPosition =
                    finalDimensions.x !== undefined && finalDimensions.y !== undefined
                        ? { x: finalDimensions.x, y: finalDimensions.y }
                        : findNextAvailablePosition(prev, w, h);

                const newItems = [
                    ...prev,
                    {
                        i: id,
                        x: smartPosition.x,
                        y: smartPosition.y,
                        w,
                        h,
                        minW: finalDimensions.minW ?? 1,
                        maxW: finalDimensions.maxW ?? 2,
                        minH: finalDimensions.minH ?? 1,
                        maxH: finalDimensions.maxH ?? 3,
                        component,
                        isChat: false,
                        header: header || `Tool ${id}`,
                    },
                ];
                return newItems;
            });
        },
        []
    );

    const addToolWithDimensions = useCallback(
        (component: ReactNode, dimensions: Partial<ToolDimensions>, header?: ReactNode) => {
            const id = generateUniqueId("custom-tool");

            setGridItems((prev) => {
                const w = dimensions.w ?? 1;
                const h = dimensions.h ?? 1;
                const smartPosition =
                    dimensions.x !== undefined && dimensions.y !== undefined
                        ? { x: dimensions.x, y: dimensions.y }
                        : findNextAvailablePosition(prev, w, h);

                const newItems = [
                    ...prev,
                    {
                        i: id,
                        x: smartPosition.x,
                        y: smartPosition.y,
                        w,
                        h,
                        minW: dimensions.minW ?? 1,
                        maxW: dimensions.maxW ?? 2,
                        minH: dimensions.minH ?? 1,
                        maxH: dimensions.maxH ?? 3,
                        component,
                        isChat: false,
                        header: header || `Custom Tool ${id}`,
                    },
                ];
                return newItems;
            });
        },
        []
    );

    const addChatComponent = useCallback((component: ReactNode, header?: ReactNode) => {
        const id = generateUniqueId("chat");

        setGridItems((prev) => {
            const existingChatIndex = prev.findIndex((item) => item.isChat);

            if (existingChatIndex >= 0) {
                const newItems = [...prev];
                newItems[existingChatIndex] = {
                    ...newItems[existingChatIndex],
                    component,
                    header: header || newItems[existingChatIndex].header,
                };
                return newItems;
            }

            // For new chat components, try to place them in the center
            const position = findNextAvailablePosition(prev, 1, 2, 3, true);
            const newItems = [
                ...prev,
                {
                    i: id,
                    x: position.x,
                    y: position.y,
                    w: 1,
                    h: 2,
                    minW: 1,
                    maxW: 2,
                    minH: 1,
                    maxH: 3,
                    component,
                    isChat: true,
                    header: header || "Chat",
                },
            ];
            return newItems;
        });
    }, []);

    const removeGridItem = useCallback((itemId: string) => {
        console.log("Removing grid item:", itemId);
        setGridItems((prev) => {
            const newItems = prev.filter((item) => item.i !== itemId);
            return newItems;
        });
    }, []);

    const onLayoutChange = (layout: Layout[]) => {
        setGridItems((prev) =>
            prev.map((item) => {
                const layoutItem = layout.find((l) => l.i === item.i);
                if (layoutItem) {
                    return {
                        ...item,
                        x: layoutItem.x,
                        y: layoutItem.y,
                        w: layoutItem.w,
                        h: layoutItem.h,
                    };
                }
                return item;
            })
        );
    };

    const onResize = useCallback(
        (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout) => {
            if (newItem.h < 2 && newItem.w > 2) {
                newItem.w = 2;
                placeholder.w = 2;
            }

            if (newItem.h >= 2 && newItem.w < 1) {
                newItem.w = 1;
                placeholder.w = 1;
            }

            const maxPossibleHeight = Math.floor(containerHeight / rowHeight) - newItem.y;
            if (newItem.h > maxPossibleHeight) {
                newItem.h = maxPossibleHeight;
                placeholder.h = maxPossibleHeight;
            }
        },
        [containerHeight, rowHeight]
    );

    useEffect(() => {
        const handleResize = () => {
            setWidth(window.innerWidth);
            setContainerHeight(window.innerHeight);
            setRowHeight(Math.floor(window.innerHeight / 2));
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const layout = gridItems.map(({ i, x, y, w, h, minW, maxW, minH, maxH, static: isStatic }) => ({
        i,
        x,
        y,
        w,
        h,
        minW,
        maxW,
        minH,
        maxH,
        static: isStatic,
    }));

    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
            .react-grid-item.react-grid-placeholder {
                background: rgba(255, 255, 255, 0.2) !important;
                border: 1px dashed rgba(255, 255, 255, 0.5) !important;
                border-radius: 1.5rem !important;
                opacity: 0.6 !important;
            }
            
            .react-resizable-handle.react-resizable-handle-se,
            .react-resizable-handle.react-resizable-handle-sw,
            .react-resizable-handle.react-resizable-handle-ne,
            .react-resizable-handle.react-resizable-handle-nw,
            .react-resizable-handle.react-resizable-handle-n,
            .react-resizable-handle.react-resizable-handle-e,
            .react-resizable-handle.react-resizable-handle-s,
            .react-resizable-handle.react-resizable-handle-w {
                opacity: 0;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, [theme]);

    const layouts = {
        lg: layout,
        md: layout,
        sm: layout,
        xs: layout,
        xxs: layout,
    };

    return (
        <GridContext.Provider
            value={{
                addGridItem,
                addPositionedGridItem,
                addChatComponent,
                removeGridItem,
                addToolToGrid,
                addToolWithDimensions,
            }}
        >
            {children}
            <div ref={containerRef} className="w-full h-screen">
                <ResponsiveGridLayout
                    className="w-full"
                    layouts={layouts}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 3, md: 3, sm: 3, xs: 1, xxs: 1 }}
                    rowHeight={rowHeight}
                    width={width}
                    onLayoutChange={(layout) => onLayoutChange(layout)}
                    onResize={(layout, oldItem, newItem, placeholder) =>
                        onResize(layout, oldItem, newItem, placeholder)
                    }
                    draggableCancel=".non-draggable,button,input,textarea,select,a,.remove-button"
                    autoSize={true}
                    margin={[16, 16]}
                    containerPadding={[16, 16]}
                    isDraggable={true}
                    isResizable={true}
                    useCSSTransforms={true}
                    compactType="vertical"
                    resizeHandles={["se", "sw", "ne", "nw", "n", "e", "s", "w"]}
                >
                    {gridItems.map((item) => (
                        <div key={item.i}>
                            <ToolCard
                                className="h-full w-full cursor-move"
                                onRemove={item.isChat ? undefined : () => removeGridItem(item.i)}
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <ToolCardTitle>{item.header}</ToolCardTitle>
                                </div>
                                <ToolCardContent scrollable={true} maxHeight="calc(100% - 40px)">
                                    {item.component}
                                </ToolCardContent>
                            </ToolCard>
                        </div>
                    ))}
                </ResponsiveGridLayout>
            </div>
        </GridContext.Provider>
    );
}
