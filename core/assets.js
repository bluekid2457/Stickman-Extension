(() => {
    const app = window.StickmanExt;

    const encodeSVG = (svgString) => `data:image/svg+xml,${encodeURIComponent(svgString)}`;

    app.assets.encodeSVG = encodeSVG;
    app.assets.stickFigureAssets = {
        idle: encodeSVG(`<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"><circle cx="25" cy="12" r="6"/><path d="M25,18 v14 M25,22 l-8,6 M25,22 l8,6 M25,32 l-8,14 M25,32 l8,14"/></svg>`),
        run1: encodeSVG(`<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"><circle cx="27" cy="11" r="6"/><path d="M25,17 v14 M25,21 l8,2 M25,21 l-8,8 M25,31 l8,10 M25,31 l-10,0"/></svg>`),
        run2: encodeSVG(`<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"><circle cx="27" cy="12" r="6"/><path d="M25,18 v14 M25,22 l-8,2 M25,22 l8,8 M25,32 l-8,10 M25,32 l10,0"/></svg>`),
        jump: encodeSVG(`<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"><circle cx="25" cy="10" r="6"/><path d="M25,16 v14 M25,20 l-10,-6 M25,20 l10,-6 M25,30 l-8,-4 M25,30 l8,-4"/></svg>`),
        fall: encodeSVG(`<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"><circle cx="25" cy="15" r="6"/><path d="M25,21 v14 M25,25 l-10,-10 M25,25 l10,-10 M25,35 l-6,12 M25,35 l6,12"/></svg>`),
        sit: encodeSVG(`<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"><circle cx="20" cy="20" r="6"/><path d="M20,26 v12 M20,38 l14,0 M20,38 l8,-6 l6,6 M20,30 l-6,8 M20,30 l8,8"/></svg>`),
        wallSlide: encodeSVG(`<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"><circle cx="20" cy="15" r="6"/><path d="M20,21 v12 M20,24 l20,-10 M20,24 l20,6 M20,33 l20,0 M20,33 l20,10"/></svg>`),
        eat: encodeSVG(`<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"><circle cx="25" cy="18" r="14" fill="white"/><ellipse cx="25" cy="22" rx="6" ry="8" fill="black"/><path d="M25,32 v8 M25,34 l-12,-12 M25,34 l12,-12 M25,40 l-8,10 M25,40 l8,10"/></svg>`)
    };
})();
