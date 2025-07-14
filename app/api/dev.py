"""
Development API endpoints - only available in development mode
"""
from fastapi import APIRouter, HTTPException, Query
from pathlib import Path
import os
import re
from typing import Dict, List, Optional, Tuple
import json

router = APIRouter()

def is_dev_mode_available() -> bool:
    """Check if we're running from source (not packaged)"""
    return not getattr(os.sys, 'frozen', False)

def extract_jsx_element_by_class_or_text(file_path: str, element_info: str) -> Optional[Dict]:
    """Extract JSX element based on class names, text content, or other attributes"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        lines = content.split('\n')
        
        # Parse element_info to extract search criteria
        search_terms = []
        class_terms = []
        text_terms = []
        
        print(f"[DEBUG] Searching in {file_path}")
        print(f"[DEBUG] Element info: {element_info}")
        
        # Extract class names
        if 'class:' in element_info:
            classes = element_info.split('class:')[1].split(',')[0].strip()
            # Only keep meaningful class names (not common utility classes)
            meaningful_classes = []
            for cls in classes.split():
                # Skip very common Tailwind utilities that appear everywhere
                if cls not in ['flex', 'items-center', 'text-sm', 'text-white', 'w-full'] and len(cls) > 2:
                    meaningful_classes.append(cls)
            class_terms = meaningful_classes[:5]  # Limit to 5 most specific classes
            search_terms.extend(class_terms)
        
        # Extract text content
        if 'text:' in element_info:
            text = element_info.split('text:')[1].split(',')[0].strip()
            if text and len(text) > 2:
                text_terms.append(text)
                search_terms.append(text)
        
        print(f"[DEBUG] Class terms: {class_terms}")
        print(f"[DEBUG] Text terms: {text_terms}")
        
        # Find the line containing the text content first
        text_line_idx = None
        if text_terms:
            for i, line in enumerate(lines):
                if any(text_term in line for text_term in text_terms):
                    text_line_idx = i
                    print(f"[DEBUG] Found text '{text_terms[0]}' at line {i+1}")
                    break
        
        if text_line_idx is None and not class_terms:
            print(f"[DEBUG] No text or classes to search for")
            return None
        
        # Now find the JSX element containing this text
        best_match = None
        
        if text_line_idx is not None:
            # Search backwards from text line to find opening tag
            jsx_start = text_line_idx
            element_name = None
            
            # Track nesting to skip child elements
            nesting_level = 0
            
            for j in range(text_line_idx, max(0, text_line_idx - 20), -1):
                line = lines[j]
                
                # Count closing tags (increases nesting when going backwards)
                closing_tags = re.findall(r'</([A-Za-z]+)>', line)
                for tag in closing_tags:
                    nesting_level += 1
                    
                # Look for opening tags
                opening_matches = list(re.finditer(r'<([A-Z][A-Za-z]*|[a-z]+)(?:\s|>)', line))
                for match in reversed(opening_matches):  # Process from right to left
                    tag_name = match.group(1)
                    # Check if this is a self-closing tag
                    # Look for /> after this tag on the same line
                    line_after_tag = line[match.start():]
                    # Find the end of this tag
                    tag_end = line_after_tag.find('>')
                    if tag_end != -1:
                        tag_content = line_after_tag[:tag_end + 1]
                        if tag_content.rstrip().endswith('/>'):
                            print(f"[DEBUG] Skipping self-closing tag <{tag_name} /> at line {j+1}")
                            continue
                        
                    if nesting_level == 0:
                        # This is our containing element
                        jsx_start = j
                        element_name = tag_name
                        print(f"[DEBUG] Found opening tag <{element_name}> at line {j+1}")
                        
                        # Verify this element contains our classes if we have them
                        if class_terms:
                            # Check the next few lines for className
                            element_text = '\n'.join(lines[j:min(j+5, len(lines))])
                            has_classes = any(cls in element_text for cls in class_terms)
                            if has_classes:
                                break
                        else:
                            break
                    else:
                        # This opens a nested element, decrease nesting
                        nesting_level -= 1
                        
                if element_name:
                    break
            
            # Find the closing tag
            jsx_end = text_line_idx
            if element_name:
                # Look for the specific closing tag
                tag_depth = 1
                for j in range(jsx_start + 1, min(len(lines), jsx_start + 50)):
                    line = lines[j]
                    # Count opening tags of same type
                    tag_depth += len(re.findall(f'<{element_name}\\s', line))
                    tag_depth += len(re.findall(f'<{element_name}>', line))
                    # Count closing tags
                    tag_depth -= len(re.findall(f'</{element_name}>', line))
                    
                    if tag_depth <= 0:
                        jsx_end = j
                        print(f"[DEBUG] Found closing tag </{element_name}> at line {j+1}")
                        break
            
            # Extract with context
            context_start = max(0, jsx_start - 3)
            context_end = min(len(lines), jsx_end + 3)
            
            best_match = {
                'code': '\n'.join(lines[context_start:context_end + 1]),
                'start_line': jsx_start + 1,
                'end_line': jsx_end + 1,
                'total_lines': jsx_end - jsx_start + 1,
                'match_score': 10,  # High score for text match
                'match_terms': search_terms,
                'element_name': element_name or 'Unknown'
            }
        
        # If no text match, fall back to class-only search
        elif class_terms:
            best_score = 0
            for i, line in enumerate(lines):
                # Count how many class terms appear in this line
                matches = sum(1 for term in class_terms if term in line)
                if matches > best_score and matches >= 2:
                    # This might be our element
                    print(f"[DEBUG] Potential match at line {i+1} with {matches} class matches")
                    # Similar logic as above to extract the element
                    # ... (keeping it simple for now)
        
        if best_match:
            print(f"[DEBUG] Returning match: lines {best_match['start_line']}-{best_match['end_line']}")
            return best_match
        
        print(f"[DEBUG] No suitable match found")
        return None
        
    except Exception as e:
        print(f"Error extracting JSX element from {file_path}: {e}")
        return None

def get_contextual_code(file_path: str, start_line: int, end_line: int, context_lines: int = 10) -> Dict:
    """Get code with additional context lines before and after"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Expand context
        context_start = max(0, start_line - context_lines - 1)
        context_end = min(len(lines), end_line + context_lines)
        
        return {
            'code': ''.join(lines[context_start:context_end]),
            'start_line': context_start + 1,
            'end_line': context_end,
            'total_lines': context_end - context_start,
            'highlighted_start': start_line,
            'highlighted_end': end_line
        }
    except Exception as e:
        return None

@router.get("/component-source")
async def get_component_source(
    component_name: str = Query(..., description="Name of the component to get source for"),
    file_path: str = Query(..., description="File path where the component is located"),
    element_info: str = Query("", description="Additional element information for better matching")
):
    """Get the actual source code where a component/element is defined"""
    if not is_dev_mode_available():
        raise HTTPException(status_code=403, detail="Dev mode not available in packaged version")
    
    # Convert to absolute path
    project_root = Path(__file__).parent.parent.parent
    
    # First, try the provided file path if we have element info to search for
    if element_info and file_path:
        # Ensure file_path starts with frontend/ for consistency
        if not file_path.startswith('frontend/'):
            file_path = f'frontend/src/{file_path}' if file_path.startswith('components/') else file_path
            
        full_file_path = project_root / file_path
        
        if full_file_path.exists():
            # Try to extract the specific element from the provided file
            search_result = extract_jsx_element_by_class_or_text(str(full_file_path), element_info)
            
            if search_result:
                # Debug logging
                print(f"[DEBUG] Found match in {file_path} at lines {search_result['start_line']}-{search_result['end_line']}")
                print(f"[DEBUG] Element: {search_result.get('element_name', 'Unknown')}")
                print(f"[DEBUG] Match score: {search_result.get('match_score', 0)}")
                
                search_result['file_path'] = file_path
                
                # Build response
                return {
                    "success": True,
                    "component_name": component_name,
                    "clicked_component": {
                        "file_path": search_result['file_path'],
                        "source_code": search_result['code'],
                        "line_range": f"{search_result['start_line']}-{search_result['end_line']}",
                        "total_lines": search_result['total_lines'],
                        "match_reason": f"Found element containing: {', '.join(search_result.get('match_terms', []))}"
                    },
                    "ai_prompt": f"""FILE: {search_result['file_path']}
LINES: {search_result['start_line']}-{search_result['end_line']} ({search_result['total_lines']} lines)
ELEMENT: {component_name}
CONTEXT: Component containing {', '.join(search_result.get('match_terms', []))}

CODE:
```tsx
{search_result['code']}
```"""
                }
    
    # Fallback: If no element_info or file doesn't exist, return the entire file
    if not file_path.startswith('frontend/'):
        file_path = f'frontend/src/{file_path}' if not file_path.startswith('/') else file_path
    
    full_file_path = project_root / file_path
    
    if not full_file_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
    
    # Return the entire file as fallback
    try:
        with open(str(full_file_path), 'r', encoding='utf-8') as f:
            content = f.read()
        lines = content.split('\n')
        
        return {
            "success": True,
            "component_name": component_name,
            "clicked_component": {
                "file_path": file_path,
                "source_code": content,
                "line_range": f"1-{len(lines)}",
                "total_lines": len(lines),
                "match_reason": "Full file (element location not determined)"
            },
            "ai_prompt": f"""FILE: {file_path}
LINES: 1-{len(lines)} ({len(lines)} lines)
ELEMENT: {component_name}
CONTEXT: Full file (element location not determined)

CODE:
```tsx
{content}
```"""
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")

@router.get("/dev-status")
async def check_dev_status():
    """Check if dev mode is available"""
    return {
        "dev_mode_available": is_dev_mode_available(),
        "message": "Dev mode available" if is_dev_mode_available() else "Dev mode not available in packaged version"
    } 