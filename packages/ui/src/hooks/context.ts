import { useContext, useMemo } from 'react';

export function useCustomContext<T>(Context: React.Context<T>) {
  const context = useContext(Context);

  const proxy = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler: ProxyHandler<any> = {
      get: function (...args) {
        if (context === null) {
          return undefined;
        }
        return Reflect.get(...args);
      },
    };

    return new Proxy(context ?? {}, handler);
  }, [context]);

  const res = useMemo<[Partial<Exclude<T, null>>, T]>(() => [proxy, context], [context, proxy]);

  return res;
}
