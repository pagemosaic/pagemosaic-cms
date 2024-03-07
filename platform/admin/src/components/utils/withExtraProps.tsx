import React from 'react';

// HOC function
function withExtraProps<P>(
    WrappedComponent: React.ComponentType<P>
) {
    // Return a new component
    return class extends React.Component<P> {
        render() {
            // Spread the extraProps onto the WrappedComponent
            return <WrappedComponent {...this.props} />;
        }
    };
}

export default withExtraProps;
