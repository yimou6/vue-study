/**
 * @param prevVNode
 * @param nextVNode
 * @param container
 */
import VNodeFlags from "./vnodeflags";
import {mount} from "./mount";
import ChildrenFlags from "./childrenflags";

export function patch(prevVNode, nextVNode, container) {
    // 分别拿到新旧 VNode 的类型，即 flags
    const nextFlags = nextVNode.flags
    const prevFlags = prevVNode.flags

    // 检查新旧 VNode 的类型是否相同，如果类型不同，则直接调用 replaceVNode 函数替换 VNode
    // 如果新旧 VNode 的类型相同，则根据不同的类型调用不同的比对函数
    if (prevFlags !== nextFlags) {
        replaceVNode(prevVNode, nextVNode, container)
    } else if (nextFlags & VNodeFlags.ELEMENT) {
        patchElement(prevVNode, nextVNode, container)
    } else if (nextFlags & VNodeFlags.COMPONENT) {
        patchComponent(prevVNode, nextVNode, container)
    } else if (nextFlags & VNodeFlags.TEXT) {
        patchText(prevVNode, nextVNode)
    } else if (nextFlags & VNodeFlags.FRAGMENT) {
        patchFragment(prevVNode, nextVNode, container)
    } else if (nextFlags & VNodeFlags.PORTAL) {
        patchPortal(prevVNode, nextVNode)
    }
}

/**
 * 替换VNode
 * @param prevVNode
 * @param nextVNode
 * @param container
 */
function replaceVNode(prevVNode, nextVNode, container) {
    // 将旧的 VNode 所渲染的 DOM 从容器中移除
    container.removeChild(prevVNode.el)
    // 再把新的 VNode 挂载到容器中
    mount(nextVNode, container)
}

/**
 * 更新标签元素
 * @param prevVNode
 * @param nextVNode
 * @param container
 */
function patchElement(prevVNode, nextVNode, container) {
    // 如果新旧 VNode 描述的是不同的标签，则调用 replaceVNode 函数，使用新的 VNode 替换旧的 VNode
    if (prevVNode.tag !== nextVNode.tag) {
        replaceVNode(prevVNode, nextVNode, container)
        return
    }

    // 拿到 el 元素，注意这时要让 nextVNode.el 也引用该元素
    const el = (nextVNode.el = prevVNode.el)
    // 拿到 新旧 VNodeData
    const prevData = prevVNode.data
    const nextData = nextVNode.data
    // 新的 VNodeData 存在时才有必要更新
    if (nextData) {
        // 遍历新的 VNodeData, 将旧值和新值都传递给 patchData 函数
        for (let key in nextData) {
            // 根据 key 拿到新旧 VNodeData值
            const prevValue = prevData[key]
            const nextValue = nextData[key]
            patchData(el, key, prevValue, nextValue)

        }
    }
    if (prevData) {
        // 遍历旧的 VNodeData, 将已经不存在于新的 VNodeData 中的数据移除
        for (let key in  prevData) {
            const prevValue = prevData[key]
            if (prevValue && !nextData.hasOwnProperty(key)) {
                // 第四个参数为null，代表移除数据
                patchData(el, key, prevValue, null)
            }
        }
    }

    // 调用 patchChildren 函数递归地更新子节点
    patchChildren(
        prevVNode.childFlags, // 旧的 VNode 子节点的类型
        nextVNode.childFlags, // 新的 VNode 子节点的类型
        prevVNode.children,   // 旧的 VNode 子节点
        nextVNode.children,   // 新的 VNode 子节点
        el                    // 当前标签元素，即这些子节点的父节点
    )
}

/**
 * 更新组件
 * @param prevVNode
 * @param nextVNode
 * @param container
 */
function patchComponent(prevVNode, nextVNode, container) {
    // 检查组件是否是有状态组件
    if (nextVNode.flags & VNodeFlags.COMPONENT_STATEFUL_NORMAL) {
        // 1 获取组件实例
        const instance = (nextVNode.children = prevVNode.children)
        // 2 更新 props
        instance.$props = nextVNode.data
        // 3 更新组件
        instance._update()
    }
}

/**
 * 更新文本节点
 * @param prevVNode
 * @param nextVNode
 */
function patchText(prevVNode, nextVNode) {
    // 拿到文本元素 el,同时让 nextVNode.el 指向该文本元素
    const el = (nextVNode.el = prevVNode.el)
    // 只有当新旧文本内容不一致时才有必要更新
    if (nextVNode.children !== prevVNode.children) {
        el.nodeValue = nextVNode.children
    }
}

/**
 * 更新 Fragment
 * @param prevVNode
 * @param nextVNode
 * @param container
 */
function patchFragment(prevVNode, nextVNode, container) {
    patchChildren(
        prevVNode.childFlags,
        nextVNode.childFlags,
        prevVNode.children,
        nextVNode.children,
        container
    )

    switch (nextVNode.childFlags) {
        case ChildrenFlags.SINGLE_VNODE:
            nextVNode.el = nextVNode.children.el
            break
        case ChildrenFlags.NO_CHILDREN:
            nextVNode.el = prevVNode.el
            break
        default:
            nextVNode.el = nextVNode.children[0].el
    }
}

/**
 * 更新 Portal
 * @param prevVNode
 * @param nextVNode
 */
function patchPortal(prevVNode, nextVNode) {
    patchChildren(
        prevVNode.childFlags,
        nextVNode.childFlags,
        prevVNode.children,
        nextVNode.children,
        prevVNode.tag // 注意容器元素是旧的 container
    )

    // 让 nextVNode.el 指向 prevVNode.el
    nextVNode.el = prevVNode.el

    // 如果新旧容器不同，才需要搬运
    if (nextVNode.tag !== prevVNode.tag) {
        // 获取新的容器元素，即挂载目标
        const container =
            typeof nextVNode.tag === 'string'
                ? document.querySelector(nextVNode.tag)
                : nextVNode.tag

        switch (nextVNode.childFlags) {
            case ChildrenFlags.SINGLE_VNODE:
                // 如果新的 Portal 是单个子节点，就把该节点搬运到新容器中
                container.appendChild(nextVNode.children.el)
                break
            case ChildrenFlags.NO_CHILDREN:
                // 新的 Portal 没有子节点，不需要搬运
                break
            default:
                // 如果新的 Portal 是多个子节点，遍历逐个将他们搬运到新容器中
                for (let i = 0; i < nextVNode.children.length; i++) {
                    container.appendChild(nextVNode.children[i].el)
                }
                break
        }
    }
}

/**
 * 更新 VNodeData
 * @param el
 * @param key
 * @param prevValue
 * @param nextValue
 */
export function patchData(el, key, prevValue, nextValue) {
    const domPropsRE = /\[A-Z]^(?:value|checked|selected|muted)$/
    switch (key) {
        case 'style':
            // 遍历新的 VNodeData 中的 style 数据，将新的样式应用到元素
            for (let k in nextValue) {
                el.style[k] = nextValue[k]
            }
            // 遍历旧的 VNodeData 中的 style 数据，将已经不存在于新的 VNodeData 的数据移除
            for (let k in prevValue) {
                if (!nextValue.hasOwnProperty(k)) {
                    el.style[k] = ''
                }
            }
            break
        case 'class':
            el.className = nextValue
            break
        default:
            if (key[0] === 'o' && key[1] === 'n') {
                // 事件
                // 移除旧事件
                if (prevValue) {
                    el.removeEventListener(key.slice(2), prevValue)
                }
                // 添加新事件
                if (nextValue) {
                    el.addEventListener(key.slice(2), nextValue)
                }
            } else if (domPropsRE.test(key)) {
                // 当作 DOM Prop 处理
                el[key] = nextValue
            } else {
                // 当作 Attr 处理
                el.setAttribute(key, nextValue)
            }
            break
    }
}

/**
 * 更新子节点
 * @param prevChildFlags
 * @param nextChildFlags
 * @param prevChildren
 * @param nextChildren
 * @param container
 */
function patchChildren(prevChildFlags, nextChildFlags, prevChildren, nextChildren, container) {
    switch (prevChildFlags) {
        // 旧的 children 是单个子节点
        case ChildrenFlags.SINGLE_VNODE:
            switch (nextChildFlags) {
                case ChildrenFlags.SINGLE_VNODE:
                    // 新的 children 也是单个子节点
                    // 直接调用 path 更新
                    patch(prevChildren, nextChildren, container)
                    break
                case ChildrenFlags.NO_CHILDREN:
                    // 新的 children 中没有子节点
                    // 移除旧节点
                    container.removeChild(prevChildren.el)
                    break
                default:
                    // 新的 children 中有多个子节点
                    // 移除旧节点
                    container.removeChild(prevChildren.el)
                    // 遍历新的多个子节点，逐个挂载到容器中
                    for (let i = 0; i < nextChildren.length; i++) {
                        mount(nextChildren[i], container)
                    }
                    break
            }
            break
        // 旧的 children 中没有子节点
        case ChildrenFlags.NO_CHILDREN:
            switch (nextChildFlags) {
                case ChildrenFlags.SINGLE_VNODE:
                    // 新的 children 是单个子节点
                    mount(nextChildren, container)
                    break
                case ChildrenFlags.NO_CHILDREN:
                    // 新的 children 中没有子节点
                    break
                default:
                    // 新的 children 中有多个子节点
                    for (let i = 0; i < nextChildren.length; i++) {
                        mount(nextChildren[i], container)
                    }
                    break
            }
            break
        // 旧的 children 中有多个子节点
        default:
            switch (nextChildFlags) {
                case ChildrenFlags.SINGLE_VNODE:
                    // 新的 children 是单个子节点
                    // 循环移除旧节点
                    for (let i = 0; i < prevChildren.length; i++) {
                        container.removeChild(prevChildren[i].el)
                    }
                    // 挂载新节点
                    mount(nextChildren, container)
                    break
                case ChildrenFlags.NO_CHILDREN:
                    // 新的 children 中没有子节点
                    for (let i = 0; i < prevChildren.length; i++) {
                        container.removeChild(prevChildren[i].el)
                    }
                    break
                default:
                    // 新的 children 中有多个子节点
                    for (let i = 0; i < prevChildren.length; i++) {
                        container.removeChild(prevChildren[i].el)
                    }
                    for (let i = 0; i < nextChildren.length; i++) {
                        mount(nextChildren[i], container)
                    }
                    break
            }
            break
    }
}
