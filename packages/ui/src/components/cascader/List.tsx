import type { AbstractTreeNode, MultipleTreeNode, SingleTreeNode } from '../tree';
import type { DCascaderContextData, DCascaderOption } from './Cascader';

import { useCallback, useEffect, useMemo, useContext } from 'react';

import { usePrefixConfig, useAsync, useTranslation } from '../../hooks';
import { getClassName } from '../../utils';
import { DVirtualScroll } from '../_virtual-scroll';
import { DCheckbox } from '../checkbox';
import { DIcon } from '../icon';
import { DCascaderContext } from './Cascader';
import { ID_SEPARATOR } from './utils';

export interface DListProps<T> {
  dList: AbstractTreeNode<T, DCascaderOption<T>>[];
}

export function DList<T>(props: DListProps<T>) {
  const { dList } = props;

  //#region Context
  const dPrefix = usePrefixConfig();
  const {
    cascaderSelecteds,
    cascaderFocusValues,
    cascaderUniqueId,
    cascaderRendered,
    cascaderMultiple,
    cascaderOnlyLeafSelectable,
    cascaderOptionRender,
    cascaderGetId,
    onModelChange,
    onFocusValuesChange,
    onClose,
  } = useContext(DCascaderContext) as DCascaderContextData<T>;
  //#endregion

  const [t] = useTranslation('Common');
  const asyncCapture = useAsync();

  const canSelectOption = useCallback((option: AbstractTreeNode<T, DCascaderOption<T>>) => option.enabled, []);
  const compareOption = useCallback((a: AbstractTreeNode<T, DCascaderOption<T>>, b: AbstractTreeNode<T, DCascaderOption<T>>) => {
    return a.id.join(ID_SEPARATOR) === b.id.join(ID_SEPARATOR);
  }, []);

  const [focusOption, focusIndex] = useMemo(() => {
    let focusOption: AbstractTreeNode<T, DCascaderOption<T>> | null = null;
    const ids = cascaderFocusValues.map((v) => cascaderGetId(v));
    const focusIndex = dList.findIndex((item) => item.id.every((id, index) => id === ids[index]));
    if (focusIndex !== -1 && dList[0].value.length === cascaderFocusValues.length) {
      focusOption = dList[focusIndex];
    }
    return [focusOption, focusIndex];
  }, [cascaderFocusValues, cascaderGetId, dList]);
  const focusIds = focusOption ? focusOption.id : null;

  const handleOptionClick = useCallback(
    (option: AbstractTreeNode<T, DCascaderOption<T>>, isSwitch?: boolean) => {
      if (canSelectOption(option)) {
        if (cascaderMultiple) {
          isSwitch = isSwitch ?? true;

          const checkeds = (option as MultipleTreeNode<T, DCascaderOption<T>>).changeStatus(
            isSwitch ? (option.checked ? 'UNCHECKED' : 'CHECKED') : 'CHECKED',
            cascaderSelecteds as T[][]
          );
          onModelChange(checkeds);
        } else {
          if (cascaderOnlyLeafSelectable) {
            if (option.isLeaf) {
              const checkeds = (option as SingleTreeNode<T, DCascaderOption<T>>).setChecked();
              onModelChange(checkeds);
            }
          } else {
            const checkeds = (option as SingleTreeNode<T, DCascaderOption<T>>).setChecked();
            onModelChange(checkeds);
          }
          if (option.isLeaf) {
            onClose();
          }
        }
      }
    },
    [canSelectOption, cascaderMultiple, cascaderOnlyLeafSelectable, cascaderSelecteds, onClose, onModelChange]
  );

  const changeFocus = useCallback(
    (option: AbstractTreeNode<T, DCascaderOption<T>> | null) => {
      if (option) {
        onFocusValuesChange(option.value);
      } else {
        onFocusValuesChange([]);
      }
    },
    [onFocusValuesChange]
  );

  useEffect(() => {
    const [asyncGroup, asyncId] = asyncCapture.createGroup();

    if (cascaderRendered && focusOption) {
      asyncGroup.fromEvent<KeyboardEvent>(window, 'keydown').subscribe({
        next: (e) => {
          switch (e.code) {
            case 'ArrowLeft':
              e.preventDefault();
              if (cascaderFocusValues.length > 1) {
                onFocusValuesChange(cascaderFocusValues.slice(0, -1));
              }
              break;

            case 'ArrowRight':
              e.preventDefault();
              if (focusOption.children && focusOption.children[0]) {
                onFocusValuesChange(focusOption.children[0].value);
              }
              break;

            case 'Enter':
              e.preventDefault();
              handleOptionClick(focusOption, false);
              break;

            case 'Space':
              e.preventDefault();
              if (cascaderMultiple) {
                handleOptionClick(focusOption, true);
              }
              break;

            default:
              break;
          }
        },
      });
    }

    return () => {
      asyncCapture.deleteGroup(asyncId);
    };
  }, [asyncCapture, cascaderFocusValues, cascaderMultiple, cascaderRendered, focusOption, handleOptionClick, onFocusValuesChange]);

  const itemRender = useCallback(
    (item: AbstractTreeNode<T, DCascaderOption<T>>, renderProps) => {
      const optionIds = item.id;
      const id = optionIds.join(ID_SEPARATOR);
      let isFocus = false;
      if (cascaderFocusValues.length > 0) {
        isFocus = optionIds.every((id, index) => cascaderFocusValues[index] && id === cascaderGetId(cascaderFocusValues[index]));
      }

      return (
        <li
          {...renderProps}
          key={id}
          id={`${dPrefix}cascader-${cascaderUniqueId}-option-${id}`}
          className={getClassName(`${dPrefix}select__option`, {
            'is-selected': !cascaderMultiple && item.checked,
            'is-focus': isFocus,
            'is-disabled': item.disabled,
            'is-loading': item.node['dLoading'],
          })}
          role="option"
          title={item.node.dLabel}
          aria-selected={item.checked}
          aria-disabled={item.disabled}
          onClick={
            item.disabled
              ? undefined
              : () => {
                  changeFocus(item);
                  if (cascaderMultiple) {
                    if (item.isLeaf) {
                      handleOptionClick(item);
                    }
                  } else {
                    handleOptionClick(item);
                  }
                }
          }
        >
          {cascaderMultiple && (
            <DCheckbox
              dModel={[item.checked]}
              dIndeterminate={item.indeterminate}
              dDisabled={item.disabled}
              onClick={(e) => {
                e.stopPropagation();
                changeFocus(item);
                handleOptionClick(item);
              }}
            ></DCheckbox>
          )}
          <span className={`${dPrefix}select__option-content`}>{cascaderOptionRender(item.node)}</span>
          {!item.isLeaf && (
            <div className={`${dPrefix}cascader-list__icon`}>
              {item.node['dLoading'] ? (
                <DIcon viewBox="0 0 1024 1024" dSpin>
                  <path d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z"></path>
                </DIcon>
              ) : (
                <DIcon viewBox="64 64 896 896">
                  <path d="M765.7 486.8L314.9 134.7A7.97 7.97 0 00302 141v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 000-50.4z"></path>
                </DIcon>
              )}
            </div>
          )}
        </li>
      );
    },
    [cascaderFocusValues, cascaderGetId, cascaderMultiple, cascaderOptionRender, cascaderUniqueId, changeFocus, dPrefix, handleOptionClick]
  );

  const childrenList = useMemo(() => {
    if (focusIndex !== -1) {
      const node = dList[focusIndex];
      if (!node.node['dLoading'] && node.children) {
        return <DList dList={node.children}></DList>;
      }
    }
  }, [dList, focusIndex]);

  return (
    <>
      <DVirtualScroll
        className={getClassName(`${dPrefix}select__list`, `${dPrefix}cascader-list`)}
        role="listbox"
        aria-multiselectable={cascaderMultiple}
        aria-activedescendant={focusIds ? `${dPrefix}cascader-${cascaderUniqueId}-option-${focusIds.join(ID_SEPARATOR)}` : undefined}
        dFocusOption={focusOption}
        dHasSelected={!!focusOption}
        dRendered={cascaderRendered}
        dList={dList}
        dCanSelectOption={canSelectOption}
        dCompareOption={compareOption}
        dItemRender={itemRender}
        dEmpty={
          <li key={`${dPrefix}cascader-empty`} className={`${dPrefix}select__empty`}>
            <span className={`${dPrefix}select__option-content`}>{t('No Data')}</span>
          </li>
        }
        dSize={264}
        dItemSize={32}
        dPaddingSize={4}
        onFocusChange={changeFocus}
      ></DVirtualScroll>
      {childrenList}
    </>
  );
}
