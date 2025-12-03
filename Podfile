require_relative '../node_modules/react-native/scripts/react_native_pods'
require_relative '../node_modules/@react-native/virtualized-lists/react-native.config'

platform :ios, '13.0'

target 'StepTrackerApp' do
  config = use_native_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true
  )

  pod 'react-native-healthkit', :path => '../node_modules/@kingstinct/react-native-healthkit'

  target 'StepTrackerAppTests' do
    inherit! :complete
  end

  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false
    )
  end
end
