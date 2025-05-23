"use client";

import { ReactNode, useState, createContext, useContext, useEffect, useRef, useCallback } from "react";
import { Responsive, WidthProvider, Layout } from "react-grid-layout";
import { ToolCard, ToolCardTitle, ToolCardContent } from "@/components/ui/tool-card";
import { useTheme } from "next-themes";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

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
    addChatComponent: (component: ReactNode, header?: ReactNode) => void;
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

    const addGridItem = useCallback((component: ReactNode, header?: ReactNode) => {
        const id = `item-${Date.now()}`;
        console.log("Adding grid item:", id);
        setGridItems((prev) => {
            const newItems = [
                ...prev,
                {
                    i: id,
                    x: 0,
                    y: 0,
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
            console.log("Updated grid items:", newItems.length);
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
            const id = `item-${Date.now()}`;
            console.log("Adding positioned grid item:", id, position);
            setGridItems((prev) => {
                const newItems = [
                    ...prev,
                    {
                        i: id,
                        x: position?.x ?? 0,
                        y: position?.y ?? 0,
                        w: position?.w ?? 1,
                        h: position?.h ?? 1,
                        minW: position?.minW ?? 1,
                        maxW: position?.maxW ?? 2,
                        minH: position?.minH ?? 1,
                        maxH: position?.maxH ?? 3,
                        component,
                        isChat: position?.isChat ?? false,
                        header: header || `Component ${id}`,
                    },
                ];
                console.log("Updated grid items:", newItems.length);
                return newItems;
            });
        },
        []
    );

    const addChatComponent = useCallback((component: ReactNode, header?: ReactNode) => {
        const id = `chat-${Date.now()}`;
        console.log("Adding chat component to grid:", id);

        setGridItems((prev) => {
            const existingChatIndex = prev.findIndex((item) => item.isChat);

            if (existingChatIndex >= 0) {
                console.log("Replacing existing chat component");
                const newItems = [...prev];
                newItems[existingChatIndex] = {
                    ...newItems[existingChatIndex],
                    component,
                    header: header || newItems[existingChatIndex].header,
                };
                return newItems;
            }

            const newItems = [
                ...prev,
                {
                    i: id,
                    x: 1,
                    y: 0,
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
            console.log("Added new chat component, total items:", newItems.length);
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
        <GridContext.Provider value={{ addGridItem, addPositionedGridItem, addChatComponent }}>
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
                    draggableCancel=".non-draggable,button,input,textarea,select,a"
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
                            <ToolCard className="h-full w-full cursor-move">
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
