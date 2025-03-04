INSTRUCTIONS FOR CLAUDE 3.5: IMPLEMENTING APP PREVIEW FEATURE

Overview: Add an interactive preview feature to the app creation page that allows users to see and test their configurations in real-time before saving them.

Implementation Steps:

STEP 1: ADD PREVIEW MODE TO EDIT MODE STATE ✓
- Add implementation progress tracking
- Update editMode state to include 'preview' option
- Add Preview tab button alongside Form and JSON tabs
- Basic preview mode switching functionality

STEP 2: CREATE A STANDALONE PREVIEW COMPONENT ✓
- Build component that takes a configuration object
- Add proper input/output component types matching production app:
  * Use Dropzone for image uploads
  * Use Prompt component for text inputs
  * Use NumberInput/Slider for numeric values
  * Use Checkbox/CheckboxGroup for boolean inputs
- Match production app styling and layout
- Include state management for inputs, outputs, and loading

STEP 3: ADD API PREVIEW FLAG ✓
- Include 'X-Preview-Mode': 'true' header in API requests
- Keep the same API endpoints but mark requests as previews
- Ensure preview requests are isolated from production data

STEP 4: INTEGRATE PREVIEW INTO CREATE PAGE ✓
- Create draft configuration object from form values
- Add conditional rendering for preview mode
- Seamlessly switch between edit and preview modes
- Clean, production-like UI without preview banners

STEP 5: IMPLEMENT PREVIEW FUNCTIONALITY ✓
- Full support for all input types:
  * File upload handling for images
  * Text input for prompts
  * Numeric inputs with validation
  * Checkbox and selection inputs
- Real-time preview updates
- Proper error handling and validation
- Loading states during API calls

STEP 6: ADD FINAL UI POLISH ✓
- Clean, consistent styling matching production app
- Proper loading indicators
- Error message handling
- Download functionality for outputs
- Responsive layout and grid system

IMPLEMENTATION NOTES:
- Use the same component types as ClientPage.tsx for consistency
- Keep preview mode seamlessly integrated with the creation flow
- Maintain full functionality while staying isolated from production
- Focus on clean, professional UI without preview indicators
