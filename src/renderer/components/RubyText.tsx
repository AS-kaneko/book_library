import React from 'react';

export interface RubyTextProps {
    children: string;
    as?: keyof JSX.IntrinsicElements;
    className?: string;
}

/**
 * ふりがな付きテキストを安全にレンダリングするコンポーネント
 * <ruby>タグを含むテキストをdangerouslySetInnerHTMLでレンダリング
 * <ruby>タグを含まないテキストは通常のテキストとしてレンダリング
 */
export const RubyText: React.FC<RubyTextProps> = ({
    children,
    as: Component = 'span',
    className = '',
}) => {
    // <ruby>タグが含まれているかチェック
    const hasRubyTag = children.includes('<ruby>');

    if (!hasRubyTag) {
        // <ruby>タグがない場合は通常のテキストとしてレンダリング
        return <Component className={className}>{children}</Component>;
    }

    try {
        // <ruby>タグがある場合はHTMLとしてレンダリング
        // セキュリティ注意: このコンポーネントは信頼できるソース（textResource.ts）からのテキストのみを使用すること
        return (
            <Component
                className={className}
                dangerouslySetInnerHTML={{ __html: children }}
            />
        );
    } catch (error) {
        // エラーが発生した場合はプレーンテキストにフォールバック
        console.error('RubyText rendering error:', error);
        return <Component className={className}>{children}</Component>;
    }
};
