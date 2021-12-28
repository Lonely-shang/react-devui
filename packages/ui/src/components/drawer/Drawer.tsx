import type { DElementSelector } from '../../hooks/element-ref';
import type { Updater } from '../../hooks/two-way-binding';

import { isUndefined, toNumber } from 'lodash';
import React, { useCallback, useId, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';

import {
  usePrefixConfig,
  useComponentConfig,
  useRefSelector,
  useImmer,
  useRefCallback,
  useLockScroll,
  useDTransition,
  useMaxIndex,
} from '../../hooks';
import { getClassName, mergeStyle } from '../../utils';
import { DDialog } from '../_dialog';

export interface DDrawerContextData {
  drawerId?: string;
  closeDrawer?: () => void;
}
export const DDrawerContext = React.createContext<DDrawerContextData | null>(null);

export interface DDrawerProps extends React.HTMLAttributes<HTMLDivElement> {
  dVisible: [boolean, Updater<boolean>?];
  dContainer?: DElementSelector | false;
  dPlacement?: 'top' | 'right' | 'bottom' | 'left';
  dWidth?: number | string;
  dHeight?: number | string;
  dZIndex?: number;
  dMask?: boolean;
  dMaskClosable?: boolean;
  dHeader?: React.ReactNode;
  dFooter?: React.ReactNode;
  dDestroy?: boolean;
  dChildDrawer?: React.ReactNode;
  onClose?: () => void;
  afterVisibleChange?: (visible: boolean) => void;
  __onVisibleChange?: (distance: { visible: boolean; top: number; right: number; bottom: number; left: number }) => void;
  __zIndex?: number;
}

export function DDrawer(props: DDrawerProps) {
  const {
    dVisible,
    dContainer,
    dPlacement = 'right',
    dWidth = 400,
    dHeight = 280,
    dZIndex,
    dMask = true,
    dMaskClosable = true,
    dHeader,
    dFooter,
    dDestroy = false,
    dChildDrawer,
    onClose,
    afterVisibleChange,
    __onVisibleChange,
    __zIndex,
    className,
    style,
    children,
    ...restProps
  } = useComponentConfig(DDrawer.name, props);

  //#region Context
  const dPrefix = usePrefixConfig();
  //#endregion

  //#region Ref
  const [dialogEl, dialogRef] = useRefCallback<HTMLDivElement>();
  const [dialogContentEl, dialogContentRef] = useRefCallback<HTMLDivElement>();
  //#endregion

  const dataRef = useRef<{ preActiveEl: HTMLElement | null }>({
    preActiveEl: null,
  });

  const uniqueId = useId();

  const [visible, setVisible] = dVisible;

  const transitionState = (() => {
    const transform =
      dPlacement === 'top'
        ? 'translate(0, -100%)'
        : dPlacement === 'right'
        ? 'translate(100%, 0)'
        : dPlacement === 'bottom'
        ? 'translate(0, 100%)'
        : 'translate(-100%, 0)';
    return {
      'enter-from': { transform },
      'enter-to': { transition: 'transform 0.2s ease-out' },
      'leave-to': { transform, transition: 'transform 0.2s ease-in' },
    };
  })();
  const hidden = useDTransition({
    dEl: dialogContentEl,
    dVisible: visible,
    dCallbackList: {
      beforeEnter: (el) => {
        const rect = el.getBoundingClientRect();
        __onVisibleChange?.({
          visible: true,
          top: distance.top + (dPlacement === 'top' ? rect.height : 0),
          right: distance.right + (dPlacement === 'right' ? rect.width : 0),
          bottom: distance.bottom + (dPlacement === 'bottom' ? rect.height : 0),
          left: distance.left + (dPlacement === 'left' ? rect.width : 0),
        });

        return transitionState;
      },
      afterEnter: (el) => {
        dataRef.current.preActiveEl = document.activeElement as HTMLElement | null;
        el.focus({ preventScroll: true });
      },
      beforeLeave: (el) => {
        dataRef.current.preActiveEl?.focus({ preventScroll: true });
        __onVisibleChange?.({
          ...distance,
          visible: false,
        });
        return transitionState;
      },
    },
    afterEnter: () => {
      afterVisibleChange?.(true);
    },
    afterLeave: () => {
      afterVisibleChange?.(false);
    },
  });

  const isFixed = isUndefined(dContainer);

  const maxZIndex = useMaxIndex(!hidden);
  const zIndex = useMemo(() => {
    if (!hidden) {
      if (isUndefined(__zIndex)) {
        if (isFixed) {
          return maxZIndex;
        } else {
          return toNumber(getComputedStyle(document.body).getPropertyValue(`--${dPrefix}absolute-z-index`));
        }
      } else {
        return __zIndex;
      }
    }
  }, [__zIndex, dPrefix, hidden, isFixed, maxZIndex]);

  const handleContainer = useCallback(() => {
    if (isFixed) {
      let el = document.getElementById(`${dPrefix}drawer-root`);
      if (!el) {
        el = document.createElement('div');
        el.id = `${dPrefix}drawer-root`;
        document.body.appendChild(el);
      }
      return el;
    } else if (dContainer === false) {
      return dialogEl?.parentElement ?? null;
    }
    return null;
  }, [dContainer, dPrefix, dialogEl, isFixed]);
  const containerRef = useRefSelector(dContainer, handleContainer);

  const [distance, setDistance] = useImmer<{ visible: boolean; top: number; right: number; bottom: number; left: number }>({
    visible: false,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  const closeDrawer = useCallback(() => {
    setVisible?.(false);
    onClose?.();
  }, [onClose, setVisible]);

  useLockScroll(isFixed && !hidden);

  const childDrawer = useMemo(() => {
    if (dChildDrawer) {
      const _childDrawer = React.Children.only(dChildDrawer) as React.ReactElement<DDrawerProps>;
      return React.cloneElement<DDrawerProps>(_childDrawer, {
        ..._childDrawer.props,
        __onVisibleChange: (distance) => {
          setDistance(distance);
        },
        __zIndex: isUndefined(zIndex) ? zIndex : zIndex + 1,
      });
    }
    return null;
  }, [dChildDrawer, setDistance, zIndex]);

  const contextValue = useMemo<DDrawerContextData>(
    () => ({
      drawerId: uniqueId,
      closeDrawer,
    }),
    [closeDrawer, uniqueId]
  );

  const contentProps = useMemo<React.HTMLAttributes<HTMLDivElement>>(
    () => ({
      className: getClassName(`${dPrefix}drawer__content`, `${dPrefix}drawer__content--${dPlacement}`),
      style: {
        width: dPlacement === 'left' || dPlacement === 'right' ? dWidth : undefined,
        height: dPlacement === 'bottom' || dPlacement === 'top' ? dHeight : undefined,
      },
    }),
    [dHeight, dPlacement, dPrefix, dWidth]
  );

  const drawerNode = (
    <>
      <DDialog
        {...restProps}
        className={getClassName(className, `${dPrefix}drawer`)}
        style={mergeStyle(style, {
          position: isFixed ? undefined : 'absolute',
          transition: `transform 140ms ${distance.visible ? 'ease-out' : 'ease-in'} 60ms`,
          transform:
            dPlacement === 'top'
              ? `translateY(${(distance[dPlacement] / 3) * 2}px)`
              : dPlacement === 'right'
              ? `translateX(${-(distance[dPlacement] / 3) * 2}px)`
              : dPlacement === 'bottom'
              ? `translateY(${-(distance[dPlacement] / 3) * 2}px)`
              : `translateX(${(distance[dPlacement] / 3) * 2}px)`,
          zIndex,
        })}
        aria-labelledby={dHeader ? `${dPrefix}drawer-header-${uniqueId}` : undefined}
        dId={uniqueId}
        dVisible={visible}
        dHidden={hidden}
        dContentProps={contentProps}
        dMask={dMask}
        dMaskClosable={dMaskClosable}
        dDestroy={dDestroy}
        dDialogRef={dialogRef}
        dDialogContentRef={dialogContentRef}
        onClose={closeDrawer}
      >
        <DDrawerContext.Provider value={contextValue}>
          {dHeader}
          <div className={`${dPrefix}drawer__body`}>{children}</div>
          {dFooter}
        </DDrawerContext.Provider>
      </DDialog>
      {childDrawer}
    </>
  );

  return dContainer === false ? drawerNode : containerRef.current && ReactDOM.createPortal(drawerNode, containerRef.current);
}
