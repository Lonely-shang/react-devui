import type { DUpdater } from '../../hooks/common/useTwoWayBinding';
import type { DElementSelector } from '../../hooks/ui/useElement';
import type { DTransitionState } from '../_transition';
import type { DDrawerFooterProps, DDrawerFooterPropsWithPrivate } from './DrawerFooter';
import type { DDrawerHeaderProps, DDrawerHeaderPropsWithPrivate } from './DrawerHeader';

import { isString, isUndefined } from 'lodash';
import React, { useEffect, useId, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

import { usePrefixConfig, useComponentConfig, useElement, useLockScroll, useMaxIndex, useEventCallback, useAsync } from '../../hooks';
import { registerComponentMate, getClassName, toPx } from '../../utils';
import { DMask } from '../_mask';
import { DTransition } from '../_transition';

export interface DDrawerProps extends React.HTMLAttributes<HTMLDivElement> {
  dVisible: [boolean, DUpdater<boolean>?];
  dContainer?: DElementSelector | false;
  dPlacement?: 'top' | 'right' | 'bottom' | 'left';
  dWidth?: number | string;
  dHeight?: number | string;
  dZIndex?: number | string;
  dMask?: boolean;
  dMaskClosable?: boolean;
  dEscClosable?: boolean;
  dHeader?: React.ReactElement<DDrawerHeaderProps>;
  dFooter?: React.ReactElement<DDrawerFooterProps>;
  dChildDrawer?: React.ReactElement<DDrawerProps>;
  onClose?: () => void;
  afterVisibleChange?: (visible: boolean) => void;
}

export interface DDrawerPropsWithPrivate extends DDrawerProps {
  __zIndex?: number | string;
  __onVisibleChange?: (distance: { visible: boolean; top: number; right: number; bottom: number; left: number }) => void;
}

const TTANSITION_DURING = 200;
const { COMPONENT_NAME } = registerComponentMate({ COMPONENT_NAME: 'DDrawer' });
export function DDrawer(props: DDrawerProps): JSX.Element | null {
  const {
    children,
    dVisible,
    dContainer,
    dPlacement = 'right',
    dWidth = 400,
    dHeight = 280,
    dZIndex,
    dMask = true,
    dMaskClosable = true,
    dEscClosable = true,
    dHeader,
    dFooter,
    dChildDrawer,
    onClose,
    afterVisibleChange,
    __zIndex,
    __onVisibleChange,

    className,
    style,
    ...restProps
  } = useComponentConfig(COMPONENT_NAME, props as DDrawerPropsWithPrivate);

  //#region Context
  const dPrefix = usePrefixConfig();
  //#endregion

  //#region Ref
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerContentRef = useRef<HTMLDivElement>(null);
  //#endregion

  const asyncCapture = useAsync();

  const uniqueId = useId();
  const headerId = `${dPrefix}drawer-header-${uniqueId}`;
  const contentId = `${dPrefix}drawer-content-${uniqueId}`;

  const [distance, setDistance] = useState<{ visible: boolean; top: number; right: number; bottom: number; left: number }>({
    visible: false,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });
  const nestedStyle = {
    transition: `transform 140ms ${distance.visible ? 'ease-out' : 'ease-in'} 60ms`,
    transform:
      dPlacement === 'top'
        ? `translateY(${(distance[dPlacement] / 3) * 2}px)`
        : dPlacement === 'right'
        ? `translateX(${-(distance[dPlacement] / 3) * 2}px)`
        : dPlacement === 'bottom'
        ? `translateY(${-(distance[dPlacement] / 3) * 2}px)`
        : `translateX(${(distance[dPlacement] / 3) * 2}px)`,
  };

  const [visible, setVisible] = dVisible;

  const isFixed = isUndefined(dContainer);

  const maxZIndex = useMaxIndex(visible);
  const zIndex = (() => {
    if (!isUndefined(dZIndex)) {
      return dZIndex;
    }
    if (isUndefined(__zIndex)) {
      if (isFixed) {
        return maxZIndex;
      } else {
        return `var(--${dPrefix}zindex-absolute)`;
      }
    } else {
      return __zIndex;
    }
  })();

  const containerEl = useElement(
    isUndefined(dContainer) || dContainer === false
      ? () => {
          if (isUndefined(dContainer)) {
            let el = document.getElementById(`${dPrefix}drawer-root`);
            if (!el) {
              el = document.createElement('div');
              el.id = `${dPrefix}drawer-root`;
              document.body.appendChild(el);
            }
            return el;
          } else {
            return drawerRef.current?.parentElement ?? null;
          }
        }
      : dContainer
  );

  const closeDrawer = useEventCallback(() => {
    setVisible?.(false);
    onClose?.();
  });

  useLockScroll(isFixed && visible);

  useEffect(() => {
    if (visible) {
      const height = isString(dHeight) ? toPx(dHeight, true) : dHeight;
      const width = isString(dWidth) ? toPx(dWidth, true) : dWidth;
      __onVisibleChange?.({
        visible: true,
        top: distance.top + (dPlacement === 'top' ? height : 0),
        right: distance.right + (dPlacement === 'right' ? width : 0),
        bottom: distance.bottom + (dPlacement === 'bottom' ? height : 0),
        left: distance.left + (dPlacement === 'left' ? width : 0),
      });
    } else {
      __onVisibleChange?.({
        ...distance,
        visible: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const prevActiveEl = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (visible) {
      prevActiveEl.current = document.activeElement as HTMLElement | null;

      if (drawerContentRef.current) {
        drawerContentRef.current.focus({ preventScroll: true });
      }
    } else if (prevActiveEl.current) {
      prevActiveEl.current.focus({ preventScroll: true });
    }
  }, [asyncCapture, visible]);

  const transitionStyles: Partial<Record<DTransitionState, React.CSSProperties>> = (() => {
    const transform =
      dPlacement === 'top'
        ? 'translate(0, -100%)'
        : dPlacement === 'right'
        ? 'translate(100%, 0)'
        : dPlacement === 'bottom'
        ? 'translate(0, 100%)'
        : 'translate(-100%, 0)';

    return {
      enter: { transform },
      entering: { transition: `transform ${TTANSITION_DURING}ms ease-out` },
      leaving: { transform, transition: `transform ${TTANSITION_DURING}ms ease-in` },
      leaved: { transform },
    };
  })();

  const childDrawer = (() => {
    if (dChildDrawer) {
      return React.cloneElement<DDrawerPropsWithPrivate>(dChildDrawer, {
        ...dChildDrawer.props,
        __zIndex: isUndefined(zIndex) ? zIndex : `calc(${zIndex} + 1)`,
        __onVisibleChange: (distance) => {
          setDistance(distance);
        },
      });
    }
    return null;
  })();

  const drawerNode = (
    <>
      <DTransition
        dIn={visible}
        dDuring={TTANSITION_DURING}
        afterEnter={() => {
          afterVisibleChange?.(true);
        }}
        afterLeave={() => {
          afterVisibleChange?.(false);
        }}
      >
        {(state) => (
          <div
            {...restProps}
            ref={drawerRef}
            className={getClassName(className, `${dPrefix}drawer`)}
            style={{
              ...style,
              ...nestedStyle,
              display: state === 'leaved' ? 'none' : undefined,
              position: isFixed ? undefined : 'absolute',
              zIndex,
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={dHeader ? headerId : undefined}
            aria-describedby={contentId}
          >
            {dMask && (
              <DMask
                dVisible={visible}
                onClose={() => {
                  if (dMaskClosable) {
                    closeDrawer();
                  }
                }}
              />
            )}
            <div
              ref={drawerContentRef}
              id={contentId}
              className={getClassName(`${dPrefix}drawer__content`, `${dPrefix}drawer__content--${dPlacement}`)}
              style={{
                width: dPlacement === 'left' || dPlacement === 'right' ? dWidth : undefined,
                height: dPlacement === 'bottom' || dPlacement === 'top' ? dHeight : undefined,
                ...transitionStyles[state],
              }}
              tabIndex={-1}
              onKeyDown={(e) => {
                if (dEscClosable && e.code === 'Escape') {
                  closeDrawer();
                }
              }}
            >
              {dHeader &&
                React.cloneElement<DDrawerHeaderPropsWithPrivate>(dHeader, {
                  ...dHeader.props,
                  __id: headerId,
                  __onClose: closeDrawer,
                })}
              <div className={`${dPrefix}drawer__body`}>{children}</div>
              {dFooter &&
                React.cloneElement<DDrawerFooterPropsWithPrivate>(dFooter, {
                  ...dFooter.props,
                  __onClose: closeDrawer,
                })}
            </div>
          </div>
        )}
      </DTransition>
      {childDrawer}
    </>
  );

  return dContainer === false ? drawerNode : containerEl && ReactDOM.createPortal(drawerNode, containerEl);
}
