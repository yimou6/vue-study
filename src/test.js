import { h, render } from './index'

function handle() {
    alert('点击')
}
const child = h('input', {
    style: {
        height: '50px',
        width: '50px',
        background: 'green'
    },
    class: ['cls-a cls-b'],
    checked: true,
    type: 'checkbox',
    onclick: handle
})
const textChild = h('div', {
    style: {
        fontSize: '12px',
        color: '#ffffff'
    }
}, '纯文本')
const elementVnode = h('div', {
    style: {
        height: '100px',
        width: '100px',
        background: 'red'
    }
}, [child, textChild])
// render(elementVnode, document.getElementById('app'))

class MyComponent {
    render() {
        return h(
            'div',
            {
                style: {
                    background: 'green'
                }
            },
            [
                h('span', null, '组件内容1'),
                h('span', null, '组件内容2')
            ]
        )
    }
}
const compVnode = h(MyComponent)
console.log(compVnode)
render(compVnode, document.getElementById('app'))
