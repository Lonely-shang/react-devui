---
title: 多选组
---

## API

### DCheckboxProps

继承 `React.HTMLAttributes<HTMLElement>`。

<!-- prettier-ignore-start -->
| 参数 | 说明 | 类型 | 默认值 | 
| --- | --- | --- | --- | 
| dModel | 手动控制是否选中 | [boolean, Updater\<boolean\>?] | - |
| dIndeterminate | 是否为部分选中 | boolean | false |
| disabled | 是否禁用 | boolean | false |
| dValue | 多选组中作为标识传递 | any  | - |
| dInputProps | 应用于 `input` 元素的属性 | React.InputHTMLAttributes\<HTMLInputElement\>  | - |
| dInputRef | 将 `ref` 传递给 `input` 元素 | React.Ref\<HTMLInputElement\>  | - |
| onModelChange | 选中改变的回调 | `(checked: boolean) => void` | - |
<!-- prettier-ignore-end -->

### DCheckboxGroupProps

继承 `React.HTMLAttributes<HTMLDivElement>`。

<!-- prettier-ignore-start -->
| 参数 | 说明 | 类型 | 默认值 | 
| --- | --- | --- | --- | 
| dModel | 手动控制选择 | [any[], Updater\<any[]\>?] | - |
| disabled | 是否禁用 | boolean | false |
| dVertical | 多选组垂直排布 | boolean | false |
| onModelChange | 选中项改变的回调 | `(values: any[]) => void` | - |
<!-- prettier-ignore-end -->

### DCheckboxGroupRef

```tsx
interface DCheckboxGroupRef {
  indeterminateProps: DCheckboxProps;
  indeterminateChecked: 'mixed' | boolean;
}
```
